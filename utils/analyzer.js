import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';
import { rgbToLab, calculateDeltaE } from './colorMath';
import { unzlibSync } from 'fflate';

export const gridDimension = {
  ROWS: 8,
  COLS: 8,
  THRESHOLD: 10.5,
};

const { ROWS, COLS, THRESHOLD } = gridDimension;

// ─── Get actual pixel dimensions of an image URI ─────────────────────────────
const getImageSize = (uri) =>
  new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });

const decode1x1PngToRgb = (base64Str) => {  // no longer async
  const binaryString = atob(base64Str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Walk PNG chunks to find IDAT
  let offset = 8;
  let idatData = null;

  while (offset < bytes.length) {
    const chunkLen =
      (bytes[offset] << 24) | (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) | bytes[offset + 3];
    const chunkType = String.fromCharCode(
      bytes[offset + 4], bytes[offset + 5],
      bytes[offset + 6], bytes[offset + 7]
    );

    if (chunkType === 'IDAT') {
      idatData = bytes.slice(offset + 8, offset + 8 + chunkLen);
      break;
    }
    offset += 4 + 4 + chunkLen + 4;
  }

  if (!idatData) throw new Error('No IDAT chunk found in PNG');

  const raw = unzlibSync(idatData);

  // Scanline for 1×1 RGB PNG: [filter(1), R(1), G(1), B(1)]
  return { r: raw[1], g: raw[2], b: raw[3] };
};

// ─── Get average color of a region (in absolute pixels) ──────────────────────
export const getAverageColor = async (uri, region) => {
  try {
    const result = await manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: Math.round(region.originX),
            originY: Math.round(region.originY),
            width: Math.max(1, Math.round(region.width)),
            height: Math.max(1, Math.round(region.height)),
          },
        },
        { resize: { width: 1, height: 1 } },
      ],
      { base64: true, format: SaveFormat.PNG }
    );

    return decode1x1PngToRgb(result.base64);
  } catch (error) {
    console.error('Error in getAverageColor:', error);
    return { r: 0, g: 0, b: 0 };
  }
};

// ─── Main comparison ──────────────────────────────────────────────────────────
export const processGridComparison = async (refUri, testUri) => {
  // FIX: get actual pixel dimensions before building crop regions
  const [refSize, testSize] = await Promise.all([
    getImageSize(refUri),
    getImageSize(testUri),
  ]);

  // Build all grid cells upfront
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({ r, c });
    }
  }

  // FIX: run all cells concurrently instead of sequentially
  // Batched to avoid overwhelming the image decoder (max 12 at a time)
  const BATCH_SIZE = 12;
  const errorMap = [];

  for (let i = 0; i < cells.length; i += BATCH_SIZE) {
    const batch = cells.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async ({ r, c }) => {
        // FIX: convert percentage grid position → absolute pixels per image
        const refRegion = {
          originX: (c / COLS) * refSize.width,
          originY: (r / ROWS) * refSize.height,
          width: (1 / COLS) * refSize.width,
          height: (1 / ROWS) * refSize.height,
        };

        const testRegion = {
          originX: (c / COLS) * testSize.width,
          originY: (r / ROWS) * testSize.height,
          width: (1 / COLS) * testSize.width,
          height: (1 / ROWS) * testSize.height,
        };

        try {
          const [refColor, testColor] = await Promise.all([
            getAverageColor(refUri, refRegion),
            getAverageColor(testUri, testRegion),
          ]);
          
          const refLab = rgbToLab(refColor.r, refColor.g, refColor.b);
          const testLab = rgbToLab(testColor.r, testColor.g, testColor.b);
          const diff = calculateDeltaE(refLab, testLab);
          
          if (diff > THRESHOLD) {
            return { row: r, col: c, deltaE: diff };
          }
        } catch (err) {
          console.error(`Error processing grid [${r},${c}]:`, err);
        }

        return null;
      })
    );

    results.forEach((res) => { if (res) errorMap.push(res); });
  }

  return errorMap;
};