import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useLongStayNotesStore } from '../../stores/useLongStayNotesStore';
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from './styles';
import { createPatientInfoTable, createNotesTable, getTableOptions } from './tables';
import type { UserOptions, CellHookData } from 'jspdf-autotable';
import type { Patient } from '../../types/patient';
import type { Admission } from '../../types/admission';
import type { LongStayNote } from '../../types/longStayNote';

const validatePatientData = (patient: Patient, admission: Admission): void => {
  if (!patient.mrn) throw new Error('Missing MRN');
  if (!patient.name) throw new Error('Missing patient name');
  if (!admission.admission_date) throw new Error('Missing admission date');
  if (!admission.department) throw new Error('Missing department');
  if (!admission.diagnosis) throw new Error('Missing diagnosis');
};

export const addPatientSection = async (
  doc: jsPDF,
  patient: Patient,
  notes: LongStayNote[],
  startY: number
): Promise<number> => {
  if (!doc) throw new Error('Invalid PDF document');
  if (!patient) throw new Error('Invalid patient data');
  if (typeof startY !== 'number' || startY < 0) throw new Error('Invalid startY position');

  const admission = patient.admissions?.[0];
  if (!admission) {
    throw new Error(`No admission found for patient ${patient.mrn}`);
  }

  try {
    // Validate patient data
    validatePatientData(patient, admission);

    // Calculate available space
    const pageHeight = doc.internal.pageSize.height;
    const remainingSpace = pageHeight - startY - PDF_SPACING.margin.bottom;

    // Check if we need a new page
    if (remainingSpace < 80) {
      doc.addPage();
      startY = PDF_SPACING.margin.top;
    }

    // Create patient info table
    const patientInfoRows = createPatientInfoTable(patient);
    if (!patientInfoRows.length) {
      throw new Error('Failed to create patient info table');
    }

    // Create table options for patient info
    const tableOptions: UserOptions = {
      ...getTableOptions(startY),
      startY,
      body: patientInfoRows,
      didParseCell: (data: CellHookData) => {
        const cell = data.cell;
        if (data.row.index > 1 && data.column.index === 2) {
          cell.styles = {
            ...cell.styles,
            fontStyle: 'normal',
            textColor: PDF_COLORS.text.primary,
            fontSize: PDF_FONTS.size.body
          };
        }
      },
      willDrawCell: (data: CellHookData) => {
        const cell = data.cell;
        const doc = data.doc as jsPDF;
        
        if (cell.y !== undefined && cell.height !== undefined && data.cursor) {
          const bottomY = cell.y + cell.height;
          if (bottomY > doc.internal.pageSize.height - PDF_SPACING.margin.bottom) {
            doc.addPage();
            data.cursor.y = PDF_SPACING.margin.top;
          }
        }
      }
    };

    // Add patient info table
    autoTable(doc, tableOptions);

    // Get current Y position after patient info table
    let currentY = (doc as any).lastAutoTable.finalY + PDF_SPACING.section.spacing;

    // Add notes table if available
    if (notes?.length > 0) {
      const notesRows = createNotesTable(notes);
      
      // Check if we need a new page for notes
      if (currentY + (notesRows.length * 20) > pageHeight - PDF_SPACING.margin.bottom) {
        doc.addPage();
        currentY = PDF_SPACING.margin.top;
      }

      // Create table options for notes
      const notesTableOptions: UserOptions = {
        ...getTableOptions(currentY),
        startY: currentY,
        body: notesRows,
        didParseCell: (data: CellHookData) => {
          const cell = data.cell;
          if (data.row.index > 1 && data.column.index === 2) {
            cell.styles = {
              ...cell.styles,
              fontStyle: 'normal',
              textColor: PDF_COLORS.text.primary,
              fontSize: PDF_FONTS.size.body
            };
          }
        },
        willDrawCell: (data: CellHookData) => {
          const cell = data.cell;
          const doc = data.doc as jsPDF;
          
          if (cell.y !== undefined && cell.height !== undefined && data.cursor) {
            const bottomY = cell.y + cell.height;
            if (bottomY > doc.internal.pageSize.height - PDF_SPACING.margin.bottom) {
              doc.addPage();
              data.cursor.y = PDF_SPACING.margin.top;
            }
          }
        }
      };

      autoTable(doc, notesTableOptions);

      currentY = (doc as any).lastAutoTable.finalY + PDF_SPACING.section.spacing;
    }

    // Add separator line
    const lineY = currentY - 3;
    if (lineY >= PDF_SPACING.margin.top && lineY <= pageHeight - PDF_SPACING.margin.bottom) {
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.1);
      doc.line(
        PDF_SPACING.margin.left,
        lineY,
        doc.internal.pageSize.width - PDF_SPACING.margin.right,
        lineY
      );
    }

    return currentY;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to add patient section for ${patient.mrn}: ${errorMessage}`);
  }
};