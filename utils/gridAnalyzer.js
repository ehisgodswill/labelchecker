export const analyzeGrids = async (refUri, testUri, gridConfig = { rows: 10, cols: 10 }) => {
  const { rows, cols } = gridConfig;
  const differences = [];

  // Logic Flow:
  // 1. Load both images into memory/canvas
  // 2. Loop through rows and columns
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 3. Get average RGB for this specific grid square (r, c)
      const refRgb = await getAverageRgbFromArea(refUri, r, c);
      const testRgb = await getAverageRgbFromArea(testUri, r, c);

      // 4. Convert both to LAB
      const refLab = rgbToLab(refRgb.r, refRgb.g, refRgb.b);
      const testLab = rgbToLab(testRgb.r, testRgb.g, testRgb.b);

      // 5. Calculate Delta E
      const diff = calculateDeltaE(refLab, testLab);

      // 6. If it exceeds threshold, mark this coordinate as an error
      if (diff > 2.5) {
        differences.push({ row: r, col: c, severity: diff });
      }
    }
  }
  return differences;
};