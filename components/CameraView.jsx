import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { CameraView as Camera, useCameraPermissions } from 'expo-camera'; import * as ScreenOrientation from 'expo-screen-orientation';

// ─── Scanning overlay sub-components ──────────────────────────────────────────

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
function CanScanFrame ({ isReady }) {
  // A flattened can is landscape — roughly 3:1 ratio
  const FRAME_W = 300;
  const FRAME_H = 110;

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 200, 255, 0.5)', 'rgba(0, 200, 255, 1)'],
  });

  return (
    <View style={styles.frameWrapper}>
      {/* Guide label above */}
      <Text style={styles.guideLabel}>Align flattened can inside frame</Text>

      {/* Main frame */}
      <Animated.View
        style={[
          styles.canFrame,
          { width: FRAME_W, height: FRAME_H, borderColor },
        ]}
      >
        {/* Corner brackets */}
        <CornerBracket position="top-left" />
        <CornerBracket position="top-right" />
        <CornerBracket position="bottom-left" />
        <CornerBracket position="bottom-right" />

        {/* Animated scan line */}
        {isReady && <ScanLine frameWidth={FRAME_W} frameHeight={FRAME_H} />}

        {/* Centre cross-hair */}
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />

        {/* Can silhouette guide */}
        <View style={styles.canSilhouette}>
          <View style={styles.canSilhouetteInner} />
        </View>
      </Animated.View>

      {/* Guide label below */}
      <Text style={styles.subLabel}>Hold steady · Good lighting · Flat surface</Text>
    </View>
  );
}

// ─── Positioning tips strip ────────────────────────────────────────────────────

const TIPS = [
  { icon: '↔', label: 'Landscape' },
  { icon: '☀', label: 'Well lit' },
  { icon: '⊞', label: 'Fully flat' },
  { icon: '📏', label: '15–25 cm' },
];

function TipsStrip () {
  return (
    <View style={styles.tipsStrip}>
      {TIPS.map((t) => (
        <View key={t.label} style={styles.tipItem}>
          <Text style={styles.tipIcon}>{t.icon}</Text>
          <Text style={styles.tipLabel}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main CameraView component ─────────────────────────────────────────────────

export default function CameraView ({ onCapture }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);

  const btnScale = useRef(new Animated.Value(1)).current;

  const captureImage = async () => {
    if (!cameraRef.current || scanning) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
      // Placeholder: process photo for RGB
      onCapture({ r: 255, g: 0, b: 0 });
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
  useEffect(() => {
    // Lock to landscape when this screen mounts
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      // Unlock (or return to portrait) when leaving
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        facing="back"
        mode="picture"
        ratio="4:3"
      />

      {/* Dark vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* Top status bar */}
      <View style={styles.topBar}>
        <StatusBar status={scanning ? 'Scanning…' : 'Ready to scan'} />
      </View>

      {/* Centre scanning frame */}
      <View style={styles.centreArea} pointerEvents="none">
        <CanScanFrame isReady={!scanning} />
      </View>

      {/* Tips strip */}
      <View style={styles.bottomArea}>
        <TipsStrip />

        {/* Capture button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.captureBtn, scanning && styles.captureBtnScanning]}
            onPress={captureImage}
            activeOpacity={0.85}
            disabled={scanning}
          >
            <View style={styles.captureBtnRing}>
              <View style={styles.captureBtnCore}>
                <Text style={styles.captureBtnText}>
                  {scanning ? '…' : 'SCAN'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerHint}>
          Position the flattened can horizontally within the frame
        </Text>
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
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Vignette
  vignette: {
    ...StyleSheet.absoluteFillObject,
    background: undefined, // RN doesn't support radial; use borders trick
    borderWidth: 60,
    borderColor: 'rgba(0,0,0,0.55)',
  },

  // Top status bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
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

  // Centre scanning area
  centreArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameWrapper: {
    alignItems: 'center',
  },
  guideLabel: {
    color: CYAN,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    opacity: 0.9,
  },
  subLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Can frame
  canFrame: {
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,200,255,0.04)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: CYAN,
  },

  // Crosshair
  crosshairH: {
    position: 'absolute',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(0,200,255,0.2)',
  },
  crosshairV: {
    position: 'absolute',
    height: '60%',
    width: 1,
    backgroundColor: 'rgba(0,200,255,0.2)',
  },

  // Can silhouette
  canSilhouette: {
    position: 'absolute',
    width: '88%',
    height: '70%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canSilhouetteInner: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(0,200,255,0.04)',
  },

  // Scan line
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

  // Bottom area
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 44,
    paddingHorizontal: 24,
  },

  // Tips
  tipsStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
    backgroundColor: DARK,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tipItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 52,
  },
  tipIcon: {
    fontSize: 18,
    color: CYAN,
  },
  tipLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Capture button
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

  // Footer hint
  footerHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Permission screen
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
});