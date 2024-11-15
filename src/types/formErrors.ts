export interface FormErrors {
  [key: string]: string | undefined;
  mrn?: string;
  name?: string;
  age?: string;
  department?: string;
  assignedDoctorId?: string;
  diagnosis?: string;
  general?: string;
  submit?: string;
}