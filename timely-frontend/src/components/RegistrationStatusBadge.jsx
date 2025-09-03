import React from 'react';

const RegistrationStatusBadge = ({ status, paymentStatus, className = '' }) => {
  const getStatusConfig = (status, paymentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Review',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      case 'waitlisted':
        return {
          label: 'Waitlisted',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          label: status || 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getPaymentStatusConfig = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return {
          label: 'Paid',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          label: 'Payment Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'failed':
        return {
          label: 'Payment Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'unpaid':
        return {
          label: 'Unpaid',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          label: paymentStatus || 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig(status, paymentStatus);
  const paymentConfig = getPaymentStatusConfig(paymentStatus);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Registration Status */}
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
      >
        {statusConfig.label}
      </span>

      {/* Payment Status */}
      {paymentStatus && paymentStatus !== 'unpaid' && (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${paymentConfig.bgColor} ${paymentConfig.textColor} ${paymentConfig.borderColor}`}
        >
          {paymentConfig.label}
        </span>
      )}
    </div>
  );
};

export default RegistrationStatusBadge;