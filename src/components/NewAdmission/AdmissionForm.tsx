import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';
import { usePatientStore } from '../../stores/usePatientStore';
import { useNavigate } from '../../hooks/useNavigate';
import type { FormErrors } from '../../types/formErrors';

interface AdmissionFormData {
  mrn: string;
  name: string;
  age: number | '';
  gender: 'male' | 'female';
  admissionDate: string;
  useWeekendShift: boolean;
  shiftType: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
  assignedDoctorId: number | null;
  department: string;
  diagnosis: string;
  safetyType: 'emergency' | 'observation' | 'short-stay' | undefined;
}

const initialFormData: AdmissionFormData = {
  mrn: '',
  name: '',
  age: '',
  gender: 'male',
  admissionDate: new Date().toISOString().split('T')[0],
  useWeekendShift: false,
  shiftType: 'morning',
  assignedDoctorId: null,
  department: '',
  diagnosis: '',
  safetyType: undefined
};

const departments = [
  'Internal Medicine',
  'Pulmonology',
  'Neurology',
  'Gastroenterology',
  'Rheumatology',
  'Endocrinology',
  'Hematology',
  'Infectious Disease',
  'Thrombosis Medicine',
  'Immunology & Allergy'
] as const;

const safetyTypes = [
  { id: 'emergency', label: 'Emergency', color: 'red', description: 'Requires immediate medical attention' },
  { id: 'observation', label: 'Observation', color: 'yellow', description: 'Needs close monitoring' },
  { id: 'short-stay', label: 'Short Stay', color: 'green', description: 'Planned brief admission' }
] as const;

const AdmissionForm: React.FC = () => {
  const { users, loading: loadingUsers, error: userError, fetchUsers } = useUserStore();
  const { addPatient, loading: savingPatient, error: patientError } = usePatientStore();
  const { goBack } = useNavigate();

  const [formData, setFormData] = useState<AdmissionFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const date = new Date(formData.admissionDate);
    const dayOfWeek = date.getDay();
    const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6;
    
    setFormData(prev => {
      const updates: Partial<AdmissionFormData> = {};

      if (isWeekendDay && prev.useWeekendShift) {
        updates.shiftType = 'weekend_morning';
      } else if (!isWeekendDay || !prev.useWeekendShift) {
        updates.useWeekendShift = false;
        updates.shiftType = prev.shiftType.startsWith('weekend_') ? 'morning' : prev.shiftType;
      }

      return { ...prev, ...updates };
    });
  }, [formData.admissionDate, formData.useWeekendShift]);

  const doctors = users.filter(user => user.role === 'doctor' && user.status === 'active');
  const availableDoctors = doctors.filter(doctor => 
    formData.department && doctor.department === formData.department
  );

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.mrn.trim()) {
      errors.mrn = 'MRN is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Patient name is required';
    }

    if (formData.age === '' || formData.age < 0 || formData.age > 150) {
      errors.age = 'Please enter a valid age between 0 and 150';
    }

    if (!formData.department) {
      errors.department = 'Department is required';
    }

    if (!formData.assignedDoctorId) {
      errors.assignedDoctorId = 'Please select an assigned doctor';
    }

    if (!formData.diagnosis.trim()) {
      errors.diagnosis = 'Diagnosis is required';
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
      if (typeof formData.age !== 'number') {
        throw new Error('Invalid age');
      }

      const today = new Date();
      const birthYear = today.getFullYear() - formData.age;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split('T')[0];

      const patientData = {
        mrn: formData.mrn,
        name: formData.name,
        date_of_birth: dateOfBirth,
        gender: formData.gender,
        admission: {
          admission_date: formData.admissionDate,
          department: formData.department,
          admitting_doctor_id: formData.assignedDoctorId,
          diagnosis: formData.diagnosis,
          status: 'active' as const,
          safety_type: formData.safetyType,
          shift_type: formData.shiftType,
          is_weekend: formData.useWeekendShift
        }
      };

      await addPatient(patientData);
      setShowSuccess(true);
      
      // Reset form after successful submission
      setFormData(initialFormData);
      
      // Automatically navigate back after showing success message
      setTimeout(() => {
        goBack();
      }, 2000);
    } catch (err) {
      setFormErrors(prev => ({ ...prev, general: err instanceof Error ? err.message : 'Error admitting patient' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const updates: Partial<AdmissionFormData> = {};

      if (name === 'age') {
        updates.age = value === '' ? '' : parseInt(value, 10);
      } else if (name === 'assignedDoctorId') {
        updates.assignedDoctorId = value === '' ? null : parseInt(value, 10);
      } else if (name === 'department') {
        updates.department = value;
        updates.assignedDoctorId = null;
      } else if (name === 'safetyType') {
        updates.safetyType = value === '' ? undefined : value as AdmissionFormData['safetyType'];
      } else {
        updates[name as keyof AdmissionFormData] = value as any;
      }

      return { ...prev, ...updates };
    });

    // Clear the error for the field being updated
    const { [name]: _, ...rest } = formErrors;
    setFormErrors(rest);
  };

  const handleWeekendShiftToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const useWeekend = e.target.checked;
    setFormData(prev => ({
      ...prev,
      useWeekendShift: useWeekend,
      shiftType: useWeekend ? 'weekend_morning' : 'morning'
    }));
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const error = userError || patientError || formErrors.general;
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
        <AlertCircle className="h-5 w-5" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSuccess && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Patient admitted successfully! Redirecting...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="mrn" className="block text-sm font-medium text-gray-700 mb-1">
            MRN
          </label>
          <input
            type="text"
            id="mrn"
            name="mrn"
            value={formData.mrn}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.mrn ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
            placeholder="Enter MRN"
            required
          />
          {formErrors.mrn && (
            <p className="mt-1 text-sm text-red-600">{formErrors.mrn}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Patient Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
              required
            />
          </div>
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="0"
            max="150"
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.age ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
            required
          />
          {formErrors.age && (
            <p className="mt-1 text-sm text-red-600">{formErrors.age}</p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700 mb-1">
            Admission Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="admissionDate"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            />
          </div>
          {formData.useWeekendShift && (
            <div className="mt-2">
              <p className="text-sm text-yellow-600 mb-2">
                Weekend admission
              </p>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.useWeekendShift}
                  onChange={handleWeekendShiftToggle}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Use weekend shift schedule</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="shiftType" className="block text-sm font-medium text-gray-700 mb-1">
            Shift Type
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="shiftType"
              name="shiftType"
              value={formData.shiftType}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            >
              {formData.useWeekendShift ? (
                <>
                  <option value="weekend_morning">Weekend Morning (7:00 - 19:00)</option>
                  <option value="weekend_night">Weekend Night (19:00 - 7:00)</option>
                </>
              ) : (
                <>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </>
              )}
            </select>
          </div>
          {formData.useWeekendShift && (
            <p className="mt-1 text-sm text-gray-500">
              Weekend shifts follow a 12-hour schedule
            </p>
          )}
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              formErrors.department ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {formErrors.department && (
            <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
          )}
        </div>

        <div>
          <label htmlFor="assignedDoctorId" className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Doctor
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="assignedDoctorId"
              name="assignedDoctorId"
              value={formData.assignedDoctorId ?? ''}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                formErrors.assignedDoctorId ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                !formData.department ? 'bg-gray-50' : ''
              }`}
              required
              disabled={!formData.department}
            >
              <option value="">
                {!formData.department 
                  ? 'Select a department first'
                  : availableDoctors.length === 0 
                    ? 'No doctors available for this department'
                    : 'Select a doctor'
                }
              </option>
              {availableDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
          {formErrors.assignedDoctorId && (
            <p className="mt-1 text-sm text-red-600">{formErrors.assignedDoctorId}</p>
          )}
          {formData.department && availableDoctors.length === 0 && (
            <p className="mt-1 text-sm text-red-600">
              No doctors are currently assigned to this department
            </p>
          )}
        </div>

        <div>
          <label htmlFor="safetyType" className="block text-sm font-medium text-gray-700 mb-1">
            Safety Type
          </label>
          <div className="space-y-2">
            <select
              id="safetyType"
              name="safetyType"
              value={formData.safetyType || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">No Safety Type</option>
              {safetyTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            {formData.safetyType && (
              <div className={`p-2 bg-${safetyTypes.find(t => t.id === formData.safetyType)?.color}-50 rounded-lg`}>
                <div className="flex items-center space-x-2">
                  <AlertCircle className={`h-4 w-4 text-${safetyTypes.find(t => t.id === formData.safetyType)?.color}-600`} />
                  <span className="text-sm text-gray-600">
                    {safetyTypes.find(t => t.id === formData.safetyType)?.description}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
          Diagnosis
        </label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-2 rounded-lg border ${
            formErrors.diagnosis ? 'border-red-300' : 'border-gray-300'
          } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
          required
        />
        {formErrors.diagnosis && (
          <p className="mt-1 text-sm text-red-600">{formErrors.diagnosis}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || savingPatient}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {(submitting || savingPatient) ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Admitting Patient...</span>
            </>
          ) : (
            <span>Admit Patient</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default AdmissionForm;