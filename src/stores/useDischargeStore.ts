import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';
import { useMedicalNotesStore } from './useMedicalNotesStore';
import type { DischargeData } from '../types/discharge';
import type { ActivePatient } from '../types/activePatient';
import type { User } from '../types/user';

interface DischargeStore {
  activePatients: ActivePatient[];
  loading: boolean;
  error: string | null;
  selectedPatient: ActivePatient | null;
  fetchActivePatients: () => Promise<void>;
  setSelectedPatient: (patient: ActivePatient | null) => void;
  processDischarge: (data: DischargeData) => Promise<void>;
  subscribeToUpdates: () => () => void;
}

interface PatientData {
  mrn: string;
  name: string;
}

interface DoctorData {
  id: number;
  name: string;
  medical_code: string;
  role: User['role'];
  department: string;
}

interface AdmissionData {
  id: number;
  patient_id: number;
  admission_date: string;
  department: string;
  diagnosis: string;
  status: 'active' | 'discharged' | 'transferred';
  admitting_doctor_id: number;
  shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
  is_weekend: boolean;
  patient: { mrn: string; name: string }[];
  admitting_doctor: {
    id: number;
    name: string;
    medical_code: string;
    role: User['role'];
    department: string;
  }[];
}

export const useDischargeStore = create<DischargeStore>((set, get) => ({
  activePatients: [],
  loading: false,
  error: null,
  selectedPatient: null,

  fetchActivePatients: async () => {
    set({ loading: true, error: null });
    try {
      const { data: admissionsData, error: admissionsError } = await supabase
        .from('admissions')
        .select(`
          id,
          patient_id,
          admission_date,
          department,
          diagnosis,
          status,
          admitting_doctor_id,
          shift_type,
          is_weekend,
          patient:patients!admissions_patient_id_fkey (
            mrn,
            name
          ),
          admitting_doctor:users!admissions_admitting_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .eq('status', 'active');

      if (admissionsError) throw admissionsError;

      const admissionPatients = (admissionsData || []).map((admission: AdmissionData) => {
        const patient = admission.patient[0];
        const admittingDoctor = admission.admitting_doctor[0];

        return {
          id: admission.id,
          patient_id: admission.patient_id,
          mrn: patient?.mrn || '',
          name: patient?.name || '',
          admission_date: admission.admission_date,
          department: admission.department,
          doctor_name: admittingDoctor?.name || null,
          diagnosis: admission.diagnosis,
          status: admission.status,
          admitting_doctor_id: admission.admitting_doctor_id,
          shift_type: admission.shift_type,
          is_weekend: admission.is_weekend,
          admissions: [{
            id: admission.id,
            patient_id: admission.patient_id,
            admitting_doctor_id: admission.admitting_doctor_id,
            status: admission.status,
            department: admission.department,
            admission_date: admission.admission_date,
            discharge_date: null,
            diagnosis: admission.diagnosis,
            visit_number: 1,
            shift_type: admission.shift_type,
            is_weekend: admission.is_weekend,
            admitting_doctor: admittingDoctor ? {
              id: admittingDoctor.id,
              name: admittingDoctor.name,
              medical_code: admittingDoctor.medical_code,
              role: admittingDoctor.role,
              department: admittingDoctor.department
            } : undefined
          }]
        };
      }) as ActivePatient[];

      set({ activePatients: admissionPatients, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ error: errorMessage, loading: false });
    }
  },

  setSelectedPatient: (patient) => {
    set({ selectedPatient: patient });
  },

  processDischarge: async (data) => {
    set({ loading: true, error: null });
    try {
      const selectedPatient = get().selectedPatient;
      const currentUser = useUserStore.getState().currentUser;

      if (!selectedPatient) throw new Error('No patient selected');
      if (!currentUser) throw new Error('No user logged in');

      if (selectedPatient.isConsultation) {
        const { error: consultationError } = await supabase
          .from('consultations')
          .update({
            status: 'completed',
            completion_note: data.discharge_note,
            completed_by: currentUser.id,
            completed_at: new Date().toISOString()
          })
          .eq('id', selectedPatient.consultation_id);

        if (consultationError) throw consultationError;

        await useMedicalNotesStore.getState().addNote({
          patient_id: selectedPatient.patient_id,
          doctor_id: currentUser.id,
          note_type: 'Consultation Note',
          content: data.discharge_note
        });
      } else {
        const { error: updateError } = await supabase
          .from('admissions')
          .update({
            status: 'discharged',
            discharge_date: data.discharge_date,
            discharge_type: data.discharge_type,
            follow_up_required: data.follow_up_required,
            follow_up_date: data.follow_up_date || null,
            discharge_note: data.discharge_note,
            discharge_doctor_id: currentUser.id
          })
          .eq('id', selectedPatient.id);

        if (updateError) throw updateError;

        await useMedicalNotesStore.getState().addNote({
          patient_id: selectedPatient.patient_id,
          doctor_id: currentUser.id,
          note_type: 'Discharge Summary',
          content: data.discharge_note
        });
      }

      await get().fetchActivePatients();
      set({ selectedPatient: null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  subscribeToUpdates: () => {
    const subscription = supabase
      .channel('discharge-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'admissions' 
      }, () => {
        get().fetchActivePatients();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'consultations' 
      }, () => {
        get().fetchActivePatients();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}));