import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { gridDimension } from '../utils/analyzer';


const { ROWS, COLS } = gridDimension;

export default function ResultOverlay ({ testPhoto, errors, onReset }) {
  const isPass = errors.length === 0;

  const maxDeltaE = errors.length > 0
    ? Math.max(...errors.map(e => e.deltaE))
    : 0;

  return (
    <View style={styles.container}>
      {/* 1. The Captured Production Image */}
      <Image
        source={{ uri: testPhoto.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* 2. The Spatial Error Grid */}
      <View style={styles.gridContainer} pointerEvents="none">
        {errors.map((error, index) => (
          <View
            key={`err-${index}`}
            style={[
              styles.errorBox,
              {
                top: `${(error.row / ROWS) * 100}%`,
                left: `${(error.col / COLS) * 100}%`,
                width: `${100 / COLS}%`,
                height: `${100 / ROWS}%`,
              },
            ]}
          >
            {/* Show Delta E value for significant errors */}
            {error.deltaE > 5 && (
              <Text style={styles.errorLabel}>{error.deltaE.toFixed(1)}</Text>
            )}
          </View>
        ))}
      </View>

      {/* 3. Status Sidebar (Right-aligned to match Camera UI) */}
      <View style={[styles.sidebar, { backgroundColor: isPass ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)' }]}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>{isPass ? "PASS" : "FAIL"}</Text>
          <Text style={styles.statsText}>
            {isPass ? "MATCH" : `${errors.length} ERRORS`}
          </Text>
          {!isPass && (
            <Text style={styles.maxDeltaText}>Max ΔE: {maxDeltaE.toFixed(2)}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>RESCAN</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Legend / Hint */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isPass
            ? "Label matches Golden Sample within tolerance."
            : "Red zones indicate ink density or color mismatch."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridContainer: {
    ...StyleSheet.absoluteFill,
  },
  errorBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.4)', // Translucent red heatmap
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 140,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  maxDeltaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resetBtn: {
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  resetBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
  },
});