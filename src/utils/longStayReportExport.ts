import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { useLongStayNotesStore } from '../stores/useLongStayNotesStore';
import type { Patient } from '../types/patient';
import type { LongStayNote } from '../types/longStayNote';

interface ExportOptions {
  specialty?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export const exportLongStayReport = async (patients: Patient[], options: ExportOptions): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let currentY = 15;

    // Add header
    doc.setFontSize(20);
    doc.text('Long Stay Patient Report', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, currentY, { align: 'center' });

    if (options.specialty) {
      currentY += 7;
      doc.text(`Specialty: ${options.specialty}`, pageWidth / 2, currentY, { align: 'center' });
    }

    if (options.dateRange) {
      currentY += 7;
      doc.text(
        `Period: ${format(new Date(options.dateRange.startDate), 'dd/MM/yyyy')} to ${format(new Date(options.dateRange.endDate), 'dd/MM/yyyy')}`,
        pageWidth / 2,
        currentY,
        { align: 'center' }
      );
    }
    
    currentY += 15;

    // Add patient table
    if (patients.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Patient Name', 'MRN', 'Department', 'Attending Doctor', 'Admission Date', 'Stay Duration']],
        body: patients.map(patient => {
          const admission = patient.admissions?.[0];
          if (!admission) return [];
          
          const stayDuration = Math.ceil(
            (new Date().getTime() - new Date(admission.admission_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return [
            patient.name,
            patient.mrn,
            admission.department,
            admission.admitting_doctor?.name || 'Not assigned',
            format(new Date(admission.admission_date), 'dd/MM/yyyy'),
            `${stayDuration} days`
          ];
        }),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Fetch and add notes for each patient
      for (const patient of patients) {
        const { data: notes } = await useLongStayNotesStore.getState().fetchNotes(patient.id);
        
        if (notes && notes.length > 0) {
          // Add page break if needed
          if (currentY > doc.internal.pageSize.height - 60) {
            doc.addPage();
            currentY = 20;
          }

          // Add patient notes header
          doc.setFontSize(12);
          doc.setTextColor(79, 70, 229);
          doc.text(`Notes for ${patient.name} (MRN: ${patient.mrn})`, 14, currentY);
          currentY += 8;

          // Add notes table
          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Created By', 'Note']],
            body: notes.map((note: LongStayNote) => [
              format(new Date(note.created_at), 'dd/MM/yyyy HH:mm'),
              note.created_by.name,
              {
                content: note.content,
                styles: { cellWidth: 'auto', minCellHeight: 20 }
              }
            ]),
            styles: { 
              fontSize: 9,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: { 
              fillColor: [79, 70, 229],
              fontSize: 9
            },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 40 },
              2: { cellWidth: 'auto' }
            }
          });

          currentY = (doc as any).lastAutoTable.finalY + 15;
        }
      }
    } else {
      doc.setFontSize(12);
      doc.text('No long stay patients found.', 14, currentY);
      currentY += 15;
    }

    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`long-stay-report-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`);
  } catch (error) {
    console.error('Error generating long stay report:', error);
    throw new Error('Failed to generate long stay report');
  }
};