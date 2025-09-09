// components/KycStatusBadge.jsx
import React from 'react';

const KycStatusBadge = ({ status, className = '' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: '✓'
        };
      case 'waived':
        return {
          label: 'Waived',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: '⚡'
        };
      case 'pending':
        return {
          label: 'Pending Review',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: '⏳'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: '✗'
        };
      case 'unverified':
      default:
        return {
          label: 'Not Verified',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: '○'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${className}
      `}
      title={`KYC Status: ${config.label}`}
    >
      <span className="mr-1" aria-hidden="true">
        {config.icon}
      </span>
      {config.label}
    </span>
  );
};

export default KycStatusBadge;
