import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';
import type { User } from '../types/user';
import type { LongStayNote } from '../types/longStayNote';

interface LongStayNotesStore {
  notes: Record<number, LongStayNote[]>;
  loading: boolean;
  error: string | null;
  fetchNotes: (patientId: number) => Promise<{ data: LongStayNote[] | null; error: Error | null }>;
  addNote: (patientId: number, content: string) => Promise<void>;
}

interface NoteData {
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
  }[];
}

export const useLongStayNotesStore = create<LongStayNotesStore>((set, get) => ({
  notes: {},
  loading: false,
  error: null,

  fetchNotes: async (patientId: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('long_stay_notes')
        .select(`
          id,
          patient_id,
          content,
          created_at,
          updated_at,
          created_by:users!long_stay_notes_created_by_fkey (
            id,
            name,
            role,
            department,
            medical_code
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes = (data || []).map((note: NoteData) => {
        const createdBy = note.created_by[0];
        if (!createdBy) {
          throw new Error(`No creator found for note ${note.id}`);
        }

        return {
          id: note.id,
          patient_id: note.patient_id,
          content: note.content,
          created_at: note.created_at,
          updated_at: note.updated_at,
          created_by: {
            id: createdBy.id,
            name: createdBy.name,
            role: createdBy.role,
            department: createdBy.department,
            medical_code: createdBy.medical_code
          }
        };
      });

      set(state => ({
        notes: {
          ...state.notes,
          [patientId]: formattedNotes
        },
        loading: false
      }));

      return { data: formattedNotes, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      return { data: null, error: error as Error };
    }
  },

  addNote: async (patientId: number, content: string) => {
    set({ loading: true, error: null });
    try {
      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('long_stay_notes')
        .insert([{
          patient_id: patientId,
          content,
          created_by: currentUser.id
        }])
        .select(`
          id,
          patient_id,
          content,
          created_at,
          updated_at,
          created_by:users!long_stay_notes_created_by_fkey (
            id,
            name,
            role,
            department,
            medical_code
          )
        `)
        .single();

      if (error) throw error;

      const createdBy = data.created_by[0];
      if (!createdBy) {
        throw new Error('Failed to retrieve creator information');
      }

      const formattedNote: LongStayNote = {
        id: data.id,
        patient_id: data.patient_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: {
          id: createdBy.id,
          name: createdBy.name,
          role: createdBy.role,
          department: createdBy.department,
          medical_code: createdBy.medical_code
        }
      };

      set(state => ({
        notes: {
          ...state.notes,
          [patientId]: [formattedNote, ...(state.notes[patientId] || [])]
        },
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  }
}));