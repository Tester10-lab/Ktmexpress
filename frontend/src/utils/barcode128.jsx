import React from 'react';

/**
 * Code 128 (Subset B) Vector SVG Generator
 * Generates sharp, scale-independent vector SVG barcodes for thermal printing.
 */

// Code 128 pattern table (bar/space widths for characters 0 to 106)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes text into Code 128 bar pattern widths
 * @param {string} text 
 * @returns {Array<number>} Array of bar/space widths (1 = narrow, 2 = medium, etc.)
 */
export function encodeCode128(text) {
  if (!text) return null;

  const codes = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Standard ASCII range 32 (space) to 127
    const code = charCode >= 32 ? charCode - 32 : 0;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP);

  // Convert codes to width sequence
  const widths = [];
  codes.forEach(code => {
    const pattern = CODE128_PATTERNS[code] || '111111';
    for (let char of pattern) {
      widths.push(parseInt(char, 10));
    }
  });

  return widths;
}

/**
 * React Component to render pure Vector SVG Barcode
 */
export function Barcode128({ value, height = 50, barWidth = 2, className = '' }) {
  if (!value) return null;

  const widths = encodeCode128(String(value).trim());
  if (!widths) return null;

  const totalModules = widths.reduce((sum, w) => sum + w, 0);
  const quietZone = 10 * barWidth;
  const svgWidth = totalModules * barWidth + quietZone * 2;

  let currentX = quietZone;
  const bars = [];

  for (let i = 0; i < widths.length; i++) {
    const width = widths[i] * barWidth;
    const isBar = i % 2 === 0; // Alternates: bar, space, bar, space...

    if (isBar) {
      bars.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={width}
          height={height}
          fill="#000000"
        />
      );
    }
    currentX += width;
  }

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {bars}
    </svg>
  );
}

export default Barcode128;
