import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Image,
} from 'react-native';
import { CameraView as Camera, useCameraPermissions } from 'expo-camera';
import { gridDimension } from '../utils/analyzer';

/** Animated scan line that sweeps across the frame */
function ScanLine ({ frameWidth, frameHeight }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: frameHeight,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [frameHeight]);

  return (
    <Animated.View
      style={[
        styles.scanLine,
        { width: frameWidth, transform: [{ translateY }] },
      ]}
    />
  );
}

/** Corner bracket indicator */
function CornerBracket ({ position }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  const posStyle = {
    top: isTop ? -2 : undefined,
    bottom: !isTop ? -2 : undefined,
    left: isLeft ? -2 : undefined,
    right: !isLeft ? -2 : undefined,
  };

  const borderStyle = {
    borderTopWidth: isTop ? 3 : 0,
    borderBottomWidth: !isTop ? 3 : 0,
    borderLeftWidth: isLeft ? 3 : 0,
    borderRightWidth: !isLeft ? 3 : 0,
  };

  return (
    <Animated.View
      style={[styles.corner, posStyle, borderStyle, { opacity: pulseAnim }]}
    />
  );
}

/** Status indicator strip at the top */
function StatusBar ({ status }) {
  const dot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.statusBar}>
      <Animated.View style={[styles.statusDot, { opacity: dot }]} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

/** The main scanning frame for a flattened aluminium can */
function CanScanFrame ({ isReady, ghostUri }) {
  const FRAME_W = "100%";
  const FRAME_H = "100%";

  return (
    <View style={styles.frameWrapper}>
      <Text style={styles.guideLabel}>
        {ghostUri ? "Align Test Sample with Image" : "Align Main Sample inside frame"}
      </Text>

      <View style={[styles.canFrame, { width: FRAME_W, height: FRAME_H }]}>
        {/* Ghost Overlay: Shows the first image to help alignment */}
        {ghostUri && (
          <Image
            source={{ uri: ghostUri }}
            style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
            resizeMode="cover"
          />
        )}

        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        {isReady && <ScanLine frameWidth={FRAME_W} frameHeight={FRAME_H} />}

        {/* The Grid Guide: Helps user see the analysis zones */}
        <View style={styles.gridGuideContainer} pointerEvents="none">
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-evenly' }]}>
            {[...Array(gridDimension.ROWS)].map((_, i) => (
              <View key={`h${i}`} style={styles.gridLineH} />
            ))}
          </View>

          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', justifyContent: 'space-evenly' }]}>
            {[...Array(gridDimension.COLS)].map((_, i) => (
              <View key={`v${i}`} style={styles.gridLineV} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main CameraView component ─────────────────────────────────────────────────

export default function CameraView ({ onCapture, referenceImage }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const captureImage = async () => {
    if (!cameraRef.current || scanning) return;

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Higher quality needed for grid analysis
        skipProcessing: false,
      });

      // Pass the full photo URI back to App.js
      // App.js will decide if this is the Reference or the Test
      onCapture(photo);
    } catch (error) {
      console.error("Capture failed", error);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          To scan aluminium cans, we need access to your camera.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        facing="back"
        mode="picture"
        ratio="16:9"
      />

      <View style={styles.fullScreenFrame} pointerEvents="none">
        <CanScanFrame isReady={!scanning} ghostUri={referenceImage?.uri} />
      </View>

      <View style={styles.rightSidebar}>
        <StatusBar status={scanning ? '...' : (referenceImage ? 'TEST' : 'REF')} />

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.captureBtn, scanning && styles.captureBtnScanning]}
              onPress={captureImage}
              disabled={scanning}
            >
              <View style={styles.captureBtnRing}>
                <View style={styles.captureBtnCore}>
                  <Text style={styles.captureBtnText}>SCAN</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.verticalHint}>ALIGN LABEL</Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const CYAN = '#00C8FF';
const CYAN_DIM = 'rgba(0, 200, 255, 0.18)';
const DARK = 'rgba(0, 0, 0, 0.72)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'row',
  },
  fullScreenFrame: {
    flex: 1,
    marginHorizontal: 87,
    zIndex: 1,
  },
  rightSidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingVertical: 20,
  },

  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureBtnRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: CYAN,
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureBtnCore: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: CYAN,
    justifyContent: 'center',
    alignItems: 'center',
  },

  verticalHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    transform: [{ rotate: '90deg' }], // Vertical text for industrial look
    width: 100,
    textAlign: 'center',
    marginTop: 20,
  },

  centered: {
    flex: 1,
    backgroundColor: '#000',
  },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.25)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CYAN,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  centreArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  guideLabel: {
    color: CYAN,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    opacity: 0.9,
    position: 'absolute',
    top: 20,
  },

  canFrame: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: 'rgba(0, 200, 255, 0.3)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },

  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: CYAN,
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: CYAN,
    opacity: 0.8,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 1,
  },

  captureBtn: {
    marginBottom: 16,
  },
  captureBtnScanning: {
    opacity: 0.6,
  },
  captureBtnRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: CYAN,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,200,255,0.08)',
  },
  captureBtnCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: CYAN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.7,
  },
  captureBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
  },

  permissionScreen: {
    flex: 1,
    backgroundColor: '#080C10',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    fontSize: 52,
    marginBottom: 20,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  permissionBtn: {
    backgroundColor: CYAN,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
  },
  permissionBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },

  gridGuideContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  gridLineH: {
    width: '100%',
    height: 1,
    backgroundColor: CYAN_DIM,
  },
  gridLineV: {
    height: '100%',
    width: 1,
    backgroundColor: CYAN_DIM,
  },
});