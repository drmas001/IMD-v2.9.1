import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PDF_COLORS, PDF_FONTS, PDF_SPACING } from './styles';
import type { TableCell, TableRow, TableOptions } from './types';
import type { Patient } from '../../types/patient';
import type { LongStayNote } from '../../types/longStayNote';
import type { CellInput, CellHookData, FontStyle } from 'jspdf-autotable';

const sanitizeText = (text: string | undefined | null, maxLength = 100): string => {
  if (!text) return 'N/A';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const createHeaderRow = (title: string): CellInput[] => [{
  content: title,
  colSpan: 4,
  styles: {
    fillColor: PDF_COLORS.primary,
    textColor: [255, 255, 255],
    fontStyle: 'bold' as FontStyle,
    fontSize: PDF_FONTS.size.heading,
    halign: 'left',
    valign: 'middle'
  }
}];

export const createPatientInfoTable = (patient: Patient): CellInput[][] => {
  const admission = patient.admissions?.[0];
  if (!admission) return [];

  const rows: CellInput[][] = [
    createHeaderRow('Patient Information'),
    [
      { content: 'MRN:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: sanitizeText(patient.mrn) },
      { content: 'Department:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: sanitizeText(admission.department) }
    ],
    [
      { content: 'Patient:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: sanitizeText(patient.name) },
      { content: 'Doctor:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: sanitizeText(admission.admitting_doctor?.name ?? 'Not assigned') }
    ]
  ];

  if (admission.admission_date) {
    rows.push([
      { content: 'Admission:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: format(new Date(admission.admission_date), 'dd/MM/yyyy') },
      { content: 'Diagnosis:', styles: { fontStyle: 'bold' as FontStyle } },
      { content: sanitizeText(admission.diagnosis) }
    ]);
  }

  return rows;
};

export const createNotesTable = (notes: LongStayNote[]): CellInput[][] => {
  if (!notes.length) return [];

  const tableRows: CellInput[][] = [
    createHeaderRow('Clinical Notes'),
    [
      { 
        content: 'Date',
        styles: { 
          fontStyle: 'bold' as FontStyle,
          fontSize: PDF_FONTS.size.small,
          halign: 'left'
        }
      },
      { 
        content: 'Author',
        styles: { 
          fontStyle: 'bold' as FontStyle,
          fontSize: PDF_FONTS.size.small,
          halign: 'left'
        }
      },
      { 
        content: 'Note',
        colSpan: 2,
        styles: { 
          fontStyle: 'bold' as FontStyle,
          fontSize: PDF_FONTS.size.small,
          halign: 'left'
        }
      }
    ]
  ];

  notes.forEach(note => {
    const authorInfo = [
      note.created_by.name,
      `(${note.created_by.medical_code})`,
      note.created_by.role.charAt(0).toUpperCase() + note.created_by.role.slice(1),
      note.created_by.department
    ].filter(Boolean).join(' - ');

    tableRows.push([
      {
        content: format(new Date(note.created_at), 'dd/MM/yyyy HH:mm'),
        styles: { 
          fontSize: PDF_FONTS.size.small,
          halign: 'left',
          valign: 'top'
        }
      },
      {
        content: sanitizeText(authorInfo, 50),
        styles: { 
          fontSize: PDF_FONTS.size.small,
          halign: 'left',
          valign: 'top'
        }
      },
      {
        content: sanitizeText(note.content, 500),
        colSpan: 2,
        styles: { 
          fontSize: PDF_FONTS.size.body,
          halign: 'left',
          valign: 'top'
        }
      }
    ]);
  });

  return tableRows;
};

export const getTableOptions = (startY: number): TableOptions => ({
  startY,
  theme: 'grid',
  body: [],
  columnStyles: {
    0: { cellWidth: 35 },
    1: { cellWidth: 90 },
    2: { cellWidth: 35 },
    3: { cellWidth: 'auto' }
  },
  styles: {
    cellPadding: PDF_SPACING.table.cellPadding,
    fontSize: PDF_FONTS.size.body,
    lineColor: PDF_COLORS.border,
    lineWidth: 0.1,
    overflow: 'linebreak',
    minCellHeight: 12,
    halign: 'left',
    valign: 'middle',
    font: PDF_FONTS.regular
  },
  headStyles: {
    fillColor: PDF_COLORS.primary,
    textColor: [255, 255, 255],
    fontStyle: 'bold' as FontStyle,
    fontSize: PDF_FONTS.size.heading
  },
  alternateRowStyles: {
    fillColor: PDF_COLORS.background
  },
  margin: {
    top: PDF_SPACING.margin.top,
    right: PDF_SPACING.margin.right,
    bottom: PDF_SPACING.margin.bottom,
    left: PDF_SPACING.margin.left
  },
  didParseCell: (data: CellHookData) => {
    const cell = data.cell as TableCell;
    if (data.row.index > 1 && data.column.index === 2) {
      cell.styles = {
        ...cell.styles,
        fontStyle: 'normal',
        textColor: PDF_COLORS.text.primary,
        fontSize: PDF_FONTS.size.body
      };
    }
  },
  willDrawCell: (data: CellHookData & { cursor: { x: number; y: number }; doc: jsPDF }) => {
    const cell = data.cell as TableCell;
    const doc = data.doc;
    if (cell.y !== undefined && cell.height !== undefined && 
        cell.y + cell.height > doc.internal.pageSize.height - PDF_SPACING.margin.bottom) {
      doc.addPage();
      data.cursor.y = PDF_SPACING.margin.top;
    }
  }
});