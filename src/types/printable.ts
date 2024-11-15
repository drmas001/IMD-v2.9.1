export interface PrintablePatient {
  name: string;
  mrn: string;
  department?: string;
  doctor_name?: string | undefined;
  admission_date?: string;
  diagnosis?: string;
  admissions?: Array<{
    status: string;
    admission_date: string;
    discharge_date?: string | null;
    department: string;
    diagnosis: string;
    visit_number: number;
    safety_type?: string | null;
    users?: {
      name: string;
    };
  }>;
}