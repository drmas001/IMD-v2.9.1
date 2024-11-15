import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface DischargeNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isConsultation?: boolean;
}

const DischargeNoteEditor: React.FC<DischargeNoteEditorProps> = ({
  value,
  onChange,
  error,
  isConsultation = false
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {isConsultation ? 'Consultation Note' : 'Discharge Note'}
      </label>
      <div className="relative">
        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            error ? 'border-red-300' : 'border-gray-300'
          } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
          placeholder={isConsultation 
            ? "Enter consultation findings and recommendations..."
            : "Enter discharge summary, instructions, and recommendations..."
          }
          required
        />
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DischargeNoteEditor;