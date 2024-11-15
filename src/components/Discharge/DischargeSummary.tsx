import React from 'react';
import { FileText, Calendar, User, Clock } from 'lucide-react';
import { useDischargeStore } from '../../stores/useDischargeStore';
import { formatDate } from '../../utils/dateFormat';
import SafetyBadge from '../PatientProfile/SafetyBadge';
import type { Admission } from '../../types/admission';

const DischargeSummary: React.FC = () => {
  const { selectedPatient } = useDischargeStore();

  if (!selectedPatient) {
    return null;
  }

  const admission = selectedPatient.admissions?.[0] as Admission | undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Patient Summary</h2>
          {admission?.safety_type && (
            <SafetyBadge type={admission.safety_type} showDescription={true} />
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Patient Name</p>
              <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
              <p className="text-sm text-gray-500">MRN: {selectedPatient.mrn}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Admission Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(selectedPatient.admission_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-sm font-medium text-gray-900">{selectedPatient.department}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Attending Doctor</p>
              <p className="text-sm font-medium text-gray-900">
                {selectedPatient.doctor_name || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {selectedPatient.diagnosis && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Diagnosis</p>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                  {selectedPatient.diagnosis}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DischargeSummary;