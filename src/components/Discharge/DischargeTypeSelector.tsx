import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DischargeTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const DischargeTypeSelector: React.FC<DischargeTypeSelectorProps> = ({
  value,
  onChange,
  error
}) => {
  const dischargeTypes = [
    { 
      id: 'regular', 
      label: 'Regular Discharge',
      description: 'Standard discharge process with completed treatment'
    },
    { 
      id: 'against-medical-advice', 
      label: 'Against Medical Advice',
      description: 'Patient chooses to leave before recommended discharge'
    },
    { 
      id: 'transfer', 
      label: 'Transfer',
      description: 'Transfer to another facility or department'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Discharge Type
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dischargeTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`p-4 rounded-lg border ${
              value === type.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            } text-left transition-colors`}
          >
            <div className="font-medium text-gray-900 mb-1">{type.label}</div>
            <p className="text-sm text-gray-600">{type.description}</p>
          </button>
        ))}
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DischargeTypeSelector;