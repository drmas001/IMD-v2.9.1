import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Admission } from '../types/admission';

interface AdmissionStore {
  admissions: Admission[];
  loading: boolean;
  error: string | null;
  fetchAdmissions: (patientId: number) => Promise<void>;
}

export const useAdmissionStore = create<AdmissionStore>((set) => ({
  admissions: [],
  loading: false,
  error: null,

  fetchAdmissions: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('admissions')
        .select(`
          *,
          admitting_doctor:users!admitting_doctor_id (
            id,
            name,
            medical_code,
            role,
            department
          ),
          discharge_doctor:users!discharge_doctor_id (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .eq('patient_id', patientId)
        .order('admission_date', { ascending: false });

      if (error) throw error;

      set({ admissions: data as Admission[], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  }
}));