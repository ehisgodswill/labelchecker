import * as GLView from 'expo-gl';

export const getPixelRgb = async (photoUri) => {
  // Create a headless GL context to read the image data
  const gl = await GLView.createContextAsync();

  // This is a simplified conceptual flow for the GL buffer read:
  // 1. Load the photoUri into a GL texture
  // 2. Bind the texture to a framebuffer
  // 3. Use gl.readPixels() to get the center coordinate

  const pixelData = new Uint8Array(4);
  gl.readPixels(
    windowWidth / 2,
    windowHeight / 2,
    1, 1,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixelData
  );

  return {
    r: pixelData[0],
    g: pixelData[1],
    b: pixelData[2]
  };
};