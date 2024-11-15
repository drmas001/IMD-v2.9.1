import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Patient } from '../../types/patient';
import type { Consultation } from '../../types/consultation';

interface SpecialtyStatsProps {
  specialties: string[];
  getSpecialtyData: (specialty: string) => {
    patients: Patient[];
    consultations: Consultation[];
  };
}

const SpecialtyStats: React.FC<SpecialtyStatsProps> = ({ specialties, getSpecialtyData }) => {
  const data = specialties.map(specialty => {
    const { patients, consultations } = getSpecialtyData(specialty);
    return {
      name: specialty,
      patients: patients.length,
      consultations: consultations.length
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Department Statistics</h2>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="patients"
              name="Active Patients"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="consultations"
              name="Active Consultations"
              fill="#06b6d4"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(specialty => (
          <div
            key={specialty.name}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <h4 className="font-medium text-gray-900 mb-2">{specialty.name}</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Active Patients: <span className="font-medium text-gray-900">{specialty.patients}</span>
              </p>
              <p className="text-sm text-gray-600">
                Active Consultations: <span className="font-medium text-gray-900">{specialty.consultations}</span>
              </p>
              <p className="text-sm text-gray-600">
                Total Cases: <span className="font-medium text-gray-900">{specialty.patients + specialty.consultations}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialtyStats;