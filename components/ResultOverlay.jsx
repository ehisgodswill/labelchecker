import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Inside your Result Component
const GridOverlay = ({ diffs, gridConfig }) => {
  return (
    <View style={styles.gridContainer}>
      {diffs.map((error, index) => (
        <View
          key={index}
          style={[
            styles.errorSquare,
            {
              top: (error.row / gridConfig.rows) * 100 + '%',
              left: (error.col / gridConfig.cols) * 100 + '%',
              width: (100 / gridConfig.cols) + '%',
              height: (100 / gridConfig.rows) + '%',
              backgroundColor: 'rgba(255, 0, 0, 0.4)' // Red highlight for mismatches
            }
          ]}
        />
      ))}
    </View>
  );
};

export default function ResultOverlay ({ score, onReset }) {
  // Define thresholds for the decorator quality standards
  const isPass = score <= 1.5;
  const isWarning = score > 1.5 && score <= 3.0;

  // Dynamic UI values based on the score
  const statusColor = isPass ? '#2ECC71' : (isWarning ? '#F1C40F' : '#E74C3C');
  const statusTitle = isPass ? 'MATCH' : (isWarning ? 'CAUTION' : 'REJECT');
  const feedbackMsg = isPass
    ? "Label color is within tolerance."
    : isWarning
      ? "Minor deviation. Check ink flow."
      : "Color mismatch!.";

  return (
    <View style={[styles.fullScreen, { backgroundColor: statusColor }]}>
      <View style={styles.card}>
        <Text style={[styles.statusTitle, { color: statusColor }]}>
          {statusTitle}
        </Text>

        {/* <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Delta E (ΔE)</Text>
          <Text style={styles.scoreValue}>{score.toFixed(2)}</Text>
        </View> */}

        <Text style={styles.feedback}>{feedbackMsg}</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: statusColor }]}
          onPress={onReset}
        >
          <Text style={styles.buttonText}>NEW SCAN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  statusTitle: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 10,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    width: '100%',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feedback: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});