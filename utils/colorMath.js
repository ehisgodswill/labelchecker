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

  return { L, a:i, b:j };
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * CIEDE2000 — the most perceptually accurate Delta E formula.
 * @param {{L: number, a: number, b: number}} lab1
 * @param {{L: number, a: number, b: number}} lab2
 * @returns {number} Delta E (0 = identical, >2 = visible difference)
 */
export const calculateDeltaE = (lab1, lab2) => {
  const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;

  // Step 1 — Compute C'ab and h'ab
  const C1ab = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2ab = Math.sqrt(a2 ** 2 + b2 ** 2);
  const Cab_avg = (C1ab + C2ab) / 2;
  const Cab_avg7 = Cab_avg ** 7;

  // G factor adjusts the a* axis for chroma-dependent rotation
  const G = 0.5 * (1 - Math.sqrt(Cab_avg7 / (Cab_avg7 + 25 ** 7)));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);

  const h1p = (b1 === 0 && a1p === 0) ? 0 : ((Math.atan2(b1, a1p) * RAD2DEG + 360) % 360);
  const h2p = (b2 === 0 && a2p === 0) ? 0 : ((Math.atan2(b2, a2p) * RAD2DEG + 360) % 360);

  // Step 2 — Compute ΔL', ΔC', ΔH'
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * DEG2RAD);

  // Step 3 — Compute CIEDE2000
  const Lp_avg = (L1 + L2) / 2;
  const Cp_avg = (C1p + C2p) / 2;

  let hp_avg;
  if (C1p * C2p === 0) {
    hp_avg = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hp_avg = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hp_avg = (h1p + h2p + 360) / 2;
  } else {
    hp_avg = (h1p + h2p - 360) / 2;
  }

  const T =
    1
    - 0.17 * Math.cos((hp_avg - 30) * DEG2RAD)
    + 0.24 * Math.cos(2 * hp_avg * DEG2RAD)
    + 0.32 * Math.cos((3 * hp_avg + 6) * DEG2RAD)
    - 0.20 * Math.cos((4 * hp_avg - 63) * DEG2RAD);

  const Lp_avg_minus50_sq = (Lp_avg - 50) ** 2;
  const SL = 1 + (0.015 * Lp_avg_minus50_sq) / Math.sqrt(20 + Lp_avg_minus50_sq);
  const SC = 1 + 0.045 * Cp_avg;
  const SH = 1 + 0.015 * Cp_avg * T;

  const Cp_avg7 = Cp_avg ** 7;
  const RC = 2 * Math.sqrt(Cp_avg7 / (Cp_avg7 + 25 ** 7));

  const d_theta = 30 * Math.exp(-(((hp_avg - 275) / 25) ** 2));
  const RT = -Math.sin(2 * d_theta * DEG2RAD) * RC;

  return Math.sqrt(
    (dLp / SL) ** 2 +
    (dCp / SC) ** 2 +
    (dHp / SH) ** 2 +
    RT * (dCp / SC) * (dHp / SH)
  );
};

/**
 * Delta E 1976 — kept as a fast/cheap fallback for pre-filtering.
 * Less accurate but ~10x faster if you need a quick rejection pass.
 */
export const calculateDeltaE76 = (lab1, lab2) => {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
};