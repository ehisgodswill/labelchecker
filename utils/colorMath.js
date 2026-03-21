/**
 * Color Math Utility for Label Verification
 * Converts RGB -> XYZ -> LAB -> Delta E
 */

export const rgbToLab = (r, g, b) => {
  // 1. Normalize RGB to [0, 1]
  let r_norm = r / 255;
  let g_norm = g / 255;
  let b_norm = b / 255;

  // 2. Inverse Gamma Correction (sRGB to linear)
  const toLinear = (c) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92);
  r_norm = toLinear(r_norm);
  g_norm = toLinear(g_norm);
  b_norm = toLinear(b_norm);

  // 3. Convert Linear RGB to XYZ (D65 Illuminant)
  let x = (r_norm * 0.4124 + g_norm * 0.3576 + b_norm * 0.1805) * 100;
  let y = (r_norm * 0.2126 + g_norm * 0.7152 + b_norm * 0.0722) * 100;
  let z = (r_norm * 0.0193 + g_norm * 0.1192 + b_norm * 0.9505) * 100;

  // 4. XYZ to CIELAB
  // D65 White point constants
  const xn = 95.047;
  const yn = 100.000;
  const zn = 108.883;

  const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);

  const L = 116 * f(y / yn) - 16;
  const i = 500 * (f(x / xn) - f(y / yn));
  const j = 200 * (f(y / yn) - f(z / zn));

  return { L, i, j };
};

/**
 * Calculates Delta E (CIE76)
 * Returns the Euclidean distance between two LAB colors
 */
export const calculateDeltaE = (lab1, lab2) => {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  // Standard Delta E formula
  return Math.sqrt(dL * dL + da * da + db * db);
};