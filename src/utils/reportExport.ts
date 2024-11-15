import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { useLongStayNotesStore } from '../stores/useLongStayNotesStore';
import { addFooter } from './pdf/footer';
import { addPatientSection } from './pdf/sections';
import { PDF_SPACING, PDF_FONTS, PDF_COLORS } from './pdf/styles';
import type { Patient } from '../types/patient';
import type { LongStayNote } from '../types/longStayNote';

interface ExportOptions {
  specialty?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const validatePatientData = (patient: Patient): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const admission = patient.admissions?.[0];

  if (!patient.id) errors.push('Missing patient ID');
  if (!patient.name) errors.push('Missing patient name');
  if (!patient.mrn) errors.push('Missing MRN');
  if (!admission?.admission_date) errors.push('Missing admission date');
  if (!admission?.department) errors.push('Missing department');
  if (!admission?.diagnosis) errors.push('Missing diagnosis');

  return {
    isValid: errors.length === 0,
    errors
  };
};

const fetchPatientNotes = async (patientId: number): Promise<LongStayNote[]> => {
  try {
    const { data: notes, error } = await useLongStayNotesStore.getState().fetchNotes(patientId);
    if (error) throw error;
    return notes || [];
  } catch (error) {
    console.error(`Error fetching notes for patient ${patientId}:`, error);
    return [];
  }
};

const addSimpleHeader = (doc: jsPDF, title: string, subtitle?: string): number => {
  const pageWidth = doc.internal.pageSize.width;
  let currentY = PDF_SPACING.margin.top;

  // Add title
  doc.setFont(PDF_FONTS.bold);
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setTextColor(...PDF_COLORS.text.primary);
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += PDF_SPACING.header.spacing;

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
  currentY += PDF_SPACING.header.spacing;

  // Add separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_SPACING.margin.left,
    currentY,
    pageWidth - PDF_SPACING.margin.right,
    currentY
  );

  return currentY + PDF_SPACING.section.spacing;
};

export const exportLongStayReport = async (
  patients: Patient[],
  options: ExportOptions
): Promise<void> => {
  if (!patients?.length) {
    throw new Error('No patient data provided for the long stay report');
  }

  const validationResults = patients.map(patient => ({
    patient,
    validation: validatePatientData(patient)
  }));

  const validPatients = validationResults.filter(result => result.validation.isValid);

  if (validPatients.length === 0) {
    const errors = validationResults
      .filter(result => !result.validation.isValid)
      .map(result => `Patient ${result.patient.mrn || 'Unknown'}: ${result.validation.errors.join(', ')}`)
      .join('\n');
    throw new Error(`No valid patients could be processed for the report.\nValidation errors:\n${errors}`);
  }

  try {
    const doc = new jsPDF();
    let currentY = addSimpleHeader(
      doc,
      'Long Stay Patient Report',
      options.specialty
        ? `Specialty: ${options.specialty}`
        : options.dateRange
        ? `Period: ${format(new Date(options.dateRange.startDate), 'dd/MM/yyyy')} to ${format(new Date(options.dateRange.endDate), 'dd/MM/yyyy')}`
        : undefined
    );

    let processedPatients = 0;
    const validationErrors: string[] = [];

    for (const { patient } of validPatients) {
      try {
        // Check if we need a new page
        if (currentY > doc.internal.pageSize.height - 100) {
          doc.addPage();
          currentY = PDF_SPACING.margin.top;
        }

        const notes = await fetchPatientNotes(patient.id);
        currentY = await addPatientSection(doc, patient, notes, currentY);
        processedPatients++;
      } catch (error) {
        const errorMessage = `Error processing patient ${patient.mrn}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        validationErrors.push(errorMessage);
      }
    }

    if (processedPatients === 0) {
      throw new Error(`Failed to process any patients.\nErrors:\n${validationErrors.join('\n')}`);
    }

    // Add footer to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(doc, i, pageCount);
    }

    // Log any validation errors for debugging
    if (validationErrors.length > 0) {
      console.warn('Some patients could not be processed:', validationErrors);
    }

    // Save the PDF
    doc.save(`long-stay-report-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`);
  } catch (error) {
    console.error('Error generating long stay report:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to generate long stay report: ${error.message}`
        : 'Failed to generate long stay report'
    );
  }
};