// A4 dimensions in points (1 pt = 1/72 inch)
const A4_WIDTH = 595.28;  // 210mm
const A4_HEIGHT = 841.89; // 297mm

// Margins
const MARGIN = {
  top: 20,
  right: 12,
  bottom: 20,
  left: 12
};

// Calculate usable width
const USABLE_WIDTH = A4_WIDTH - (MARGIN.left + MARGIN.right);

export const PDF_FONTS = {
  regular: 'helvetica',
  bold: 'helvetica-bold',
  size: {
    title: 14,
    heading: 12,
    subheading: 10,
    body: 12,
    small: 10
  }
} as const;

// Define color arrays as mutable arrays
export const PDF_COLORS = {
  primary: [79, 70, 229] as [number, number, number],    // Indigo-600
  text: {
    primary: [31, 41, 55] as [number, number, number],   // Gray-800
    secondary: [75, 85, 99] as [number, number, number], // Gray-600
    muted: [107, 114, 128] as [number, number, number],  // Gray-500
    footer: [156, 163, 175] as [number, number, number]  // Gray-400
  },
  border: [229, 231, 235] as [number, number, number],   // Gray-200
  background: [249, 250, 251] as [number, number, number] // Gray-50
} as const;

export const PDF_SPACING = {
  margin: MARGIN,
  header: {
    height: 60,
    logoSize: 40,
    spacing: 15
  },
  section: {
    spacing: 10,
    margin: {
      top: 15,
      bottom: 15
    }
  },
  table: {
    rowSpacing: 4,
    cellPadding: 5
  }
} as const;