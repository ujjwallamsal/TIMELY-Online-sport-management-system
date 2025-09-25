import React, { useState } from 'react';
import { 
  AlertTriangle,
  X,
  Send,
  Loader
} from 'lucide-react';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
  description: string;
  resourceType: string;
  resourceName: string;
  isLoading?: boolean;
}

const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  resourceType,
  resourceName,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Resource Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{resourceName}</p>
                <p className="text-xs text-gray-500 capitalize">{resourceType}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Action Required</p>
                <p className="text-sm font-medium text-red-600">Delete Request</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="form-label">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input"
                rows={4}
                placeholder="Please provide a detailed reason for requesting this deletion..."
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be reviewed by administrators before the deletion is approved.
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Important Notice</p>
                  <p className="text-yellow-700">
                    This action requires approval. The {resourceType} will not be deleted immediately. 
                    An administrator will review your request and notify you of the decision.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn btn-outline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || isLoading}
                className="btn btn-danger inline-flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
