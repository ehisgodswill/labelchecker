import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import CameraView from './components/CameraView';
import ResultOverlay from './components/ResultOverlay';
import { calculateDeltaE, rgbToLab } from './utils/colorMath';

export default function App () {
  const [referenceLab, setReferenceLab] = useState(null);
  const [testLab, setTestLab] = useState(null);
  const [deltaE, setDeltaE] = useState(null);

  const handleColorCapture = (rgb) => {
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

    if (!referenceLab) {
      setReferenceLab(lab);
    } else {
      setTestLab(lab);
      const diff = calculateDeltaE(referenceLab, lab);
      setDeltaE(diff);
    }
  };

  const resetScanner = () => {
    setReferenceLab(null);
    setTestLab(null);
    setDeltaE(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Label Verifier Pro</Text>
        <Text style={styles.subtitle}>
          {!referenceLab ? "Step 1: Scan Reference Sample Label" : "Step 2: Scan Production Can"}
        </Text>
      </View>

      <CameraView onCapture={handleColorCapture} />

      {deltaE !== null && (
        <ResultOverlay
          score={deltaE}
          onReset={resetScanner}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, alignItems: 'center', backgroundColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#ffd700', marginTop: 5 }
});
