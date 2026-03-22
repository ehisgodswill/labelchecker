import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import CameraView from './components/CameraView';
import { processGridComparison } from './utils/analyzer';
import ResultOverlay from './components/ResultOverlay';

export default function App () {
  const [referencePhoto, setReferencePhoto] = useState(null);
  const [testPhoto, setTestPhoto] = useState(null);
  const [errorMap, setErrorMap] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (photo) => {
    if (!referencePhoto) {
      setReferencePhoto(photo);
    } else {
      setTestPhoto(photo);
      setIsProcessing(true);

      try {
        const errors = await processGridComparison(referencePhoto.uri, photo.uri);
        setErrorMap(errors);
      } catch (err) {
        console.error("Analysis Error:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const resetApp = () => {
    setReferencePhoto(null);
    setTestPhoto(null);
    setErrorMap(null);
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      {errorMap !== null && testPhoto && (
        <ResultOverlay
          testPhoto={testPhoto}
          errors={errorMap}
          onReset={resetApp}
        />
      )}

      {errorMap === null && (
        <CameraView
          onCapture={handleCapture}
          referenceImage={referencePhoto}
        />
      )}

      {isProcessing && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00C8FF" />
          <Text style={styles.loaderText}>ANALYZING...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderText: {
    color: '#00C8FF',
    marginTop: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});