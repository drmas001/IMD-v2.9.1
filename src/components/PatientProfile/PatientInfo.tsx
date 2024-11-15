import React from 'react';
import { User, Hash, Calendar, Stethoscope, FileText } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { formatDate } from '../../utils/dateFormat';
import { isLongStay } from '../../utils/stayCalculator';
import SafetyBadge from './SafetyBadge';
import LongStayBadge from '../LongStay/LongStayBadge';

const PatientInfo: React.FC = () => {
  const { selectedPatient } = usePatientStore();

  if (!selectedPatient) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-2" />
          <p>No patient selected</p>
        </div>
      </div>
    );
  }

  const activeAdmission = selectedPatient.admissions?.[0];
  const birthYear = new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear();
  const admissionDate = activeAdmission?.admission_date;
  const isLongStayPatient = admissionDate ? isLongStay(admissionDate) : false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Personal Details and Notes</h2>
        <div className="flex items-center space-x-2">
          {activeAdmission?.safety_type && (
            <SafetyBadge type={activeAdmission.safety_type} showDescription={true} />
          )}
          {isLongStayPatient && admissionDate && (
            <LongStayBadge admissionDate={admissionDate} showDuration={true} />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <User className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Full Name</p>
            <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">MRN</p>
            <p className="text-sm font-medium text-gray-900">{selectedPatient.mrn}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="text-sm font-medium text-gray-900">
                {birthYear} years
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{selectedPatient.gender}</p>
            </div>
          </div>
        </div>

        {admissionDate && (
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Admission Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(admissionDate)}
              </p>
            </div>
          </div>
        )}

        {activeAdmission && (
          <>
            <div className="flex items-start space-x-3">
              <Stethoscope className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Specialty</p>
                <p className="text-sm font-medium text-gray-900">{activeAdmission.department}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Assigned Doctor</p>
                {activeAdmission.admitting_doctor ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activeAdmission.admitting_doctor.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeAdmission.admitting_doctor.medical_code} • {activeAdmission.admitting_doctor.department}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No doctor assigned</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Diagnosis</p>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                  {activeAdmission.diagnosis}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientInfo;