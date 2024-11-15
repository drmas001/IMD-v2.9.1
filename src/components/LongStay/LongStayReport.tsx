import React from 'react';
import { usePatientStore } from '../../stores/usePatientStore';
import { isLongStay } from '../../utils/stayCalculator';
import type { Patient } from '../../types/patient';

interface LongStayReportProps {
  dateFilter: {
    startDate: string;
    endDate: string;
    period: string;
  };
}

const LongStayReport: React.FC<LongStayReportProps> = ({ dateFilter }) => {
  const { patients } = usePatientStore();

  const longStayPatients = patients.filter((patient: Patient) => {
    const admission = patient.admissions?.[0];
    if (!admission) return false;

    return (
      admission.status === 'active' &&
      new Date(admission.admission_date) >= new Date(dateFilter.startDate) &&
      new Date(admission.admission_date) <= new Date(dateFilter.endDate) &&
      isLongStay(admission.admission_date)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Long Stay Patients</h2>
      
      <div className="space-y-4">
        {longStayPatients.length === 0 ? (
          <p className="text-center text-gray-500">No long stay patients found in this period</p>
        ) : (
          longStayPatients.map(patient => {
            const admission = patient.admissions?.[0];
            if (!admission) return null;

            const stayDuration = Math.ceil(
              (new Date().getTime() - new Date(admission.admission_date).getTime()) / 
              (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={patient.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Department: {admission.department}
                      </p>
                      <p className="text-sm text-gray-600">
                        Doctor: {admission.admitting_doctor?.name || 'Not assigned'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Stay Duration: {stayDuration} days
                      </p>
                    </div>
                  </div>
                  {admission.safety_type && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admission.safety_type === 'emergency'
                        ? 'bg-red-100 text-red-800'
                        : admission.safety_type === 'observation'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {admission.safety_type}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LongStayReport;