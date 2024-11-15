import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useDischargeStore } from '../../stores/useDischargeStore';
import { useNavigate } from '../../hooks/useNavigate';
import DischargeStatus from './DischargeStatus';
import DischargeTypeSelector from './DischargeTypeSelector';
import FollowUpSection from './FollowUpSection';
import DischargeNoteEditor from './DischargeNoteEditor';

interface FormData {
  discharge_date: string;
  discharge_type: 'regular' | 'against-medical-advice' | 'transfer';
  follow_up_required: boolean;
  follow_up_date: string;
  discharge_note: string;
}

interface FormErrors {
  discharge_date?: string;
  discharge_type?: string;
  follow_up_date?: string;
  discharge_note?: string;
  submit?: string;
}

const DischargeForm: React.FC = () => {
  const { selectedPatient, processDischarge } = useDischargeStore();
  const { goBack } = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_type: 'regular',
    follow_up_required: false,
    follow_up_date: new Date().toISOString().split('T')[0],
    discharge_note: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!selectedPatient) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-700">
          <AlertCircle className="h-5 w-5" />
          <span>Please select a patient to process discharge</span>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.discharge_date) {
      errors.discharge_date = 'Discharge date is required';
    }

    if (formData.follow_up_required && !formData.follow_up_date) {
      errors.follow_up_date = 'Follow-up date is required when follow-up is enabled';
    }

    if (formData.follow_up_required && 
        new Date(formData.follow_up_date) <= new Date(formData.discharge_date)) {
      errors.follow_up_date = 'Follow-up date must be after discharge date';
    }

    if (!formData.discharge_note.trim()) {
      errors.discharge_note = 'Discharge note is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await processDischarge(formData);
      setShowSuccess(true);
      setTimeout(() => {
        goBack();
      }, 2000);
    } catch (error) {
      setFormErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to process discharge'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>
            {selectedPatient.isConsultation 
              ? 'Consultation completed successfully! Redirecting...'
              : 'Patient discharged successfully! Redirecting...'
            }
          </span>
        </div>
      )}

      {formErrors.submit && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{formErrors.submit}</span>
        </div>
      )}

      <DischargeStatus
        status={selectedPatient.status}
        admissionDate={selectedPatient.admission_date}
        department={selectedPatient.department}
        doctorName={selectedPatient.doctor_name}
      />

      {!selectedPatient.isConsultation && (
        <>
          <DischargeTypeSelector
            value={formData.discharge_type}
            onChange={(value) => setFormData(prev => ({ ...prev, discharge_type: value as FormData['discharge_type'] }))}
            error={formErrors.discharge_type}
          />

          <FollowUpSection
            followUpRequired={formData.follow_up_required}
            followUpDate={formData.follow_up_date}
            onFollowUpChange={(required) => setFormData(prev => ({ ...prev, follow_up_required: required }))}
            onDateChange={(date) => setFormData(prev => ({ ...prev, follow_up_date: date }))}
            error={formErrors.follow_up_date}
          />
        </>
      )}

      <DischargeNoteEditor
        value={formData.discharge_note}
        onChange={(value) => setFormData(prev => ({ ...prev, discharge_note: value }))}
        error={formErrors.discharge_note}
        isConsultation={selectedPatient.isConsultation}
      />

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>
              {selectedPatient.isConsultation ? 'Complete Consultation' : 'Process Discharge'}
            </span>
          )}
        </button>
      </div>
    </form>
  );
};

export default DischargeForm;