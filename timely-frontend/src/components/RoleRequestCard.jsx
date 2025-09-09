// components/RoleRequestCard.jsx
import React from 'react';
import KycStatusBadge from './KycStatusBadge';

const RoleRequestCard = ({ 
  request, 
  onApprove, 
  onReject, 
  isAdmin = false,
  className = '' 
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const canTakeAction = isAdmin && request.status === 'pending';

  const handleApprove = () => {
    if (onApprove) {
      onApprove(request.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${statusConfig.borderColor} shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {request.user_display_name || request.user_email}
            </h3>
            <p className="text-sm text-gray-600">{request.user_email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
            {request.user_kyc_status && (
              <KycStatusBadge status={request.user_kyc_status} />
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Requested Role:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
              {request.requested_role_display}
            </span>
          </div>
          
          {request.note && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Note:</span>
              <p className="text-sm text-gray-600 mt-1">{request.note}</p>
            </div>
          )}

          {/* Role-specific information */}
          {request.organization_name && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Organization:</span>
              <p className="text-sm text-gray-600">{request.organization_name}</p>
            </div>
          )}

          {request.coaching_experience && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Coaching Experience:</span>
              <p className="text-sm text-gray-600">{request.coaching_experience}</p>
            </div>
          )}

          {request.sport_discipline && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Sport Discipline:</span>
              <p className="text-sm text-gray-600">{request.sport_discipline}</p>
            </div>
          )}
        </div>

        {/* Review Information */}
        {request.reviewed_at && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Reviewed by:</span> {request.reviewed_by_email}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Reviewed at:</span> {new Date(request.reviewed_at).toLocaleString()}
            </div>
            {request.review_notes && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Notes:</span> {request.review_notes}
              </div>
            )}
            {request.rejection_reason && (
              <div className="text-sm text-red-600 mt-1">
                <span className="font-medium">Rejection Reason:</span> {request.rejection_reason}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {canTakeAction && (
          <div className="flex space-x-3">
            <button
              onClick={handleApprove}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Reject
            </button>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Created:</span> {new Date(request.created_at).toLocaleString()}
            {request.updated_at !== request.created_at && (
              <span className="ml-4">
                <span className="font-medium">Updated:</span> {new Date(request.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleRequestCard;
