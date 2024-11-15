export interface ActivePatient {
  id: number;
  patient_id: number;
  mrn: string;
  name: string;
  admission_date: string;
  department: string;
  doctor_name: string | null;
  diagnosis: string;
  status: 'active' | 'discharged' | 'transferred';
  admitting_doctor_id: number;
  shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
  is_weekend: boolean;
  isConsultation?: boolean;
  consultation_id?: number;
  admissions?: Array<{
    id: number;
    patient_id: number;
    admitting_doctor_id: number;
    discharge_doctor_id?: number;
    status: 'active' | 'discharged' | 'transferred';
    department: string;
    admission_date: string;
    discharge_date: string | null;
    diagnosis: string;
    visit_number: number;
    safety_type?: 'emergency' | 'observation' | 'short-stay';
    shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
    is_weekend: boolean;
    admitting_doctor?: {
      id: number;
      name: string;
      medical_code: string;
      role: 'doctor' | 'nurse' | 'administrator';
      department: string;
    };
    discharge_doctor?: {
      id: number;
      name: string;
      medical_code: string;
      role: 'doctor' | 'nurse' | 'administrator';
      department: string;
    };
  }>;
}