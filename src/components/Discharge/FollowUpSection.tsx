import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface FollowUpSectionProps {
  followUpRequired: boolean;
  followUpDate: string;
  onFollowUpChange: (required: boolean) => void;
  onDateChange: (date: string) => void;
  error?: string;
}

const FollowUpSection: React.FC<FollowUpSectionProps> = ({
  followUpRequired,
  followUpDate,
  onFollowUpChange,
  onDateChange,
  error
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="follow_up_required"
          checked={followUpRequired}
          onChange={(e) => onFollowUpChange(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="follow_up_required" className="text-sm font-medium text-gray-700">
          Follow-up Required
        </label>
      </div>

      {followUpRequired && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                error ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
              required={followUpRequired}
            />
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowUpSection;