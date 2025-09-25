import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { submitDeleteRequest, DeleteRequest } from '../api/notifications';
import { useToast } from '../contexts/ToastContext';

export const useDeleteRequest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const submitRequest = async (
    resource: string,
    resourceId: number,
    resourceName: string,
    reason: string
  ): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsSubmitting(true);
    try {
      const deleteRequest: DeleteRequest = {
        type: 'delete_request',
        resource,
        resource_id: resourceId,
        requested_by: user.id,
        reason,
      };

      await submitDeleteRequest(deleteRequest);
      showSuccess(`Delete request submitted for ${resourceName}. An administrator will review your request.`);
    } catch (error) {
      console.error('Failed to submit delete request:', error);
      showError('Failed to submit delete request. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRequest,
    isSubmitting,
  };
};
