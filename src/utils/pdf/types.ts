import type { UserOptions, CellDef, FontStyle, Cell, CellHookData, Styles } from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';

// Base cell interface with required properties
export interface TableCell extends Cell {
  content: string;
  colSpan: number;
  rowSpan: number;
  styles: Styles & {
    fillColor?: [number, number, number];
    textColor?: [number, number, number];
    fontStyle?: FontStyle;
    fontSize?: number;
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    cellPadding?: number;
    cellWidth?: number | 'auto';
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    minCellHeight?: number;
  };
}

export type TableRow = TableCell[];

// Extend UserOptions with custom properties and hooks
export interface TableOptions extends Omit<UserOptions, 'didParseCell' | 'willDrawCell'> {
  body: TableRow[];
  theme?: 'striped' | 'grid' | 'plain';
  columnStyles?: {
    [key: number]: {
      cellWidth?: number | 'auto';
      fontStyle?: FontStyle;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
  };
  startY?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alternateRowStyles?: {
    fillColor?: [number, number, number];
  };
  didParseCell?: (data: CellHookData) => void;
  willDrawCell?: (data: CellHookData & { 
    cursor: { x: number; y: number }; 
    settings: UserOptions;
  }) => void;
}