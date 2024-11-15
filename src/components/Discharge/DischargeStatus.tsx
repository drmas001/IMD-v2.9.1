import React from 'react';
import { CheckCircle, Clock, Calendar, User } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';

interface DischargeStatusProps {
  status: 'active' | 'discharged' | 'transferred';
  admissionDate: string;
  dischargeDate?: string | null;
  department: string;
  doctorName?: string | null;
}

const DischargeStatus: React.FC<DischargeStatusProps> = ({
  status,
  admissionDate,
  dischargeDate,
  department,
  doctorName
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      case 'transferred':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Admission Status</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start space-x-2">
          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Admission Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(admissionDate)}</p>
          </div>
        </div>

        {dischargeDate && (
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Discharge Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(dischargeDate)}</p>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-2">
          <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="text-sm font-medium text-gray-900">{department}</p>
          </div>
        </div>

        {doctorName && (
          <div className="flex items-start space-x-2">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Attending Doctor</p>
              <p className="text-sm font-medium text-gray-900">{doctorName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DischargeStatus;