import type { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from './styles';
import { ASSETS } from '../../config/assets';

export const addHeader = async (doc: jsPDF, title: string, subtitle?: string): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  let currentY = PDF_SPACING.margin.top;

  // Add logo
  try {
    const logoSize = PDF_SPACING.header.logoSize;
    const response = await fetch(ASSETS.LOGO.SMALL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const reader = new FileReader();
    
    await new Promise<void>((resolve, reject) => {
      reader.onloadend = () => {
        try {
          if (reader.result) {
            doc.addImage(
              reader.result as string,
              'PNG',
              PDF_SPACING.margin.left,
              currentY,
              logoSize,
              logoSize,
              undefined,
              'FAST'
            );
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    // Add title next to logo
    doc.setFont(PDF_FONTS.bold);
    doc.setFontSize(PDF_FONTS.size.title);
    doc.setTextColor(...PDF_COLORS.text.primary);
    doc.text(
      title,
      PDF_SPACING.margin.left + logoSize + PDF_SPACING.header.spacing,
      currentY + (logoSize / 2),
      { baseline: 'middle' }
    );

    currentY += logoSize + PDF_SPACING.header.spacing;
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    
    // Fallback: center the title if logo fails to load
    doc.setFont(PDF_FONTS.bold);
    doc.setFontSize(PDF_FONTS.size.title);
    doc.setTextColor(...PDF_COLORS.text.primary);
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += PDF_SPACING.header.spacing;
  }

  // Add subtitle if provided
  if (subtitle) {
    doc.setFont(PDF_FONTS.regular);
    doc.setFontSize(PDF_FONTS.size.subheading);
    doc.setTextColor(...PDF_COLORS.text.secondary);
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += PDF_SPACING.header.spacing;
  }

  // Add generation date
  doc.setFont(PDF_FONTS.regular);
  doc.setFontSize(PDF_FONTS.size.body);
  doc.setTextColor(...PDF_COLORS.text.secondary);
  doc.text(
    `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += PDF_SPACING.section.spacing;

  // Add separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_SPACING.margin.left,
    currentY,
    pageWidth - PDF_SPACING.margin.right,
    currentY
  );
  currentY += PDF_SPACING.section.spacing;

  return currentY;
};