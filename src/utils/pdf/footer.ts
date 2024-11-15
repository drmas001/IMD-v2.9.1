import type { jsPDF } from 'jspdf';
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from './styles';

export const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - PDF_SPACING.margin.bottom;

  // Add separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_SPACING.margin.left,
    footerY - 10,
    pageWidth - PDF_SPACING.margin.right,
    footerY - 10
  );

  // Add page numbers
  doc.setFont(PDF_FONTS.regular);
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setTextColor(...PDF_COLORS.text.footer);
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Add copyright notice
  const year = new Date().getFullYear();
  doc.setFontSize(PDF_FONTS.size.small);
  doc.text(
    `© ${year} IMD-Care. All rights reserved.`,
    PDF_SPACING.margin.left,
    footerY,
    { align: 'left' }
  );

  // Add disclaimer
  doc.text(
    'This is a computer-generated document.',
    pageWidth - PDF_SPACING.margin.right,
    footerY,
    { align: 'right' }
  );
};