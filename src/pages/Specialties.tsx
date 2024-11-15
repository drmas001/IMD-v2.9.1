import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { usePatientStore } from '../stores/usePatientStore';
import { useConsultationStore } from '../stores/useConsultationStore';
import SpecialtyCard from '../components/Specialties/SpecialtyCard';
import SpecialtyFilter from '../components/Specialties/SpecialtyFilter';
import SpecialtyStats from '../components/Specialties/SpecialtyStats';
import type { Patient } from '../types/patient';
import type { Consultation } from '../types/consultation';

interface SpecialtiesProps {
  onNavigateToPatient: () => void;
  selectedSpecialty?: string;
}

const Specialties: React.FC<SpecialtiesProps> = ({ onNavigateToPatient, selectedSpecialty }) => {
  const { patients } = usePatientStore();
  const { consultations } = useConsultationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState(selectedSpecialty || 'all');

  const specialties = [
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
  ];

  const getSpecialtyData = (specialty: string) => {
    const specialtyPatients = patients.filter((patient: Patient) => 
      patient.admissions?.some(admission => 
        admission.department === specialty && 
        admission.status === 'active'
      )
    );

    const specialtyConsultations = consultations.filter((consultation: Consultation) =>
      consultation.consultation_specialty === specialty &&
      consultation.status === 'active'
    );

    return {
      patients: specialtyPatients,
      consultations: specialtyConsultations
    };
  };

  const filteredSpecialties = specialties.filter(specialty =>
    filterSpecialty === 'all' || specialty === filterSpecialty
  );

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Specialties</h1>
        <p className="text-gray-600">Overview of all medical departments and their current patients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      <SpecialtyStats specialties={filteredSpecialties} getSpecialtyData={getSpecialtyData} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredSpecialties.map(specialty => {
          const { patients: specialtyPatients, consultations: specialtyConsultations } = getSpecialtyData(specialty);
          
          const filteredPatients = specialtyPatients.filter(patient =>
            searchQuery === '' ||
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.mrn.toLowerCase().includes(searchQuery.toLowerCase())
          );

          const filteredConsultations = specialtyConsultations.filter(consultation =>
            searchQuery === '' ||
            consultation.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            consultation.mrn.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <SpecialtyCard
              key={specialty}
              specialty={specialty}
              patients={filteredPatients}
              consultations={filteredConsultations}
              onNavigateToPatient={onNavigateToPatient}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Specialties;