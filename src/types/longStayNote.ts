import type { User } from './user';

export interface LongStayNote {
  id: number;
  patient_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    name: string;
    role: User['role'];
    department: string;
    medical_code: string;
  };
}