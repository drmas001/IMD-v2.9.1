import React, { useEffect } from 'react';
import { AlertCircle, Clock, Shield } from 'lucide-react';
import { usePatientStore } from '../stores/usePatientStore';
import { useDischargeStore } from '../stores/useDischargeStore';
import DischargeForm from '../components/Discharge/DischargeForm';
import DischargeSummary from '../components/Discharge/DischargeSummary';
import { isLongStay } from '../utils/stayCalculator';
import SafetyBadge from '../components/PatientProfile/SafetyBadge';
import LongStayBadge from '../components/LongStay/LongStayBadge';

const PatientDischarge: React.FC = () => {
  const { patients, fetchPatients } = usePatientStore();
  const { selectedPatient, setSelectedPatient } = useDischargeStore();

  useEffect(() => {
    // Regular fetch without discharged patients
    fetchPatients(false);

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchPatients(false);
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchPatients]);

  // Get active patients that can be discharged
  const activePatients = patients.filter(patient => 
    patient.admissions?.[0]?.status === 'active'
  );

  const handlePatientSelect = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient && patient.admissions?.[0]) {
      const admission = patient.admissions[0];
      setSelectedPatient({
        id: admission.id,
        patient_id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        admission_date: patient.admission_date!,
        department: patient.department!,
        doctor_name: patient.doctor_name ?? null,
        diagnosis: admission.diagnosis,
        status: 'active',
        admitting_doctor_id: admission.admitting_doctor_id,
        shift_type: admission.shift_type,
        is_weekend: admission.is_weekend
      });
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Discharge</h1>
        <p className="text-gray-600">Process patient discharge and create discharge summary</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Patients</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {activePatients.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No active patients to discharge
                </div>
              ) : (
                activePatients.map((patient) => {
                  const admission = patient.admissions?.[0];
                  const isLongStayPatient = patient.admission_date ? isLongStay(patient.admission_date) : false;

                  return (
                    <button
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedPatient?.patient_id === patient.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {admission?.safety_type && (
                              <SafetyBadge type={admission.safety_type} />
                            )}
                            {isLongStayPatient && patient.admission_date && (
                              <LongStayBadge 
                                admissionDate={patient.admission_date}
                                showDuration={true}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Department: {patient.department}</p>
                          <p>Doctor: {patient.doctor_name ?? 'Not assigned'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              <DischargeForm />
              <DischargeSummary />
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    No Patient Selected
                  </h3>
                  <p className="text-yellow-700">
                    Please select an active patient from the list to process their discharge.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDischarge;