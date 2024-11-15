import React from 'react';
import { Filter } from 'lucide-react';

interface SpecialtyFilterProps {
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
}

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

const SpecialtyFilter: React.FC<SpecialtyFilterProps> = ({
  selectedSpecialty,
  onSpecialtyChange
}) => {
  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <select
        value={selectedSpecialty}
        onChange={(e) => onSpecialtyChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
      >
        <option value="all">All Specialties</option>
        {specialties.map(specialty => (
          <option key={specialty} value={specialty}>{specialty}</option>
        ))}
      </select>
    </div>
  );
};

export default SpecialtyFilter;