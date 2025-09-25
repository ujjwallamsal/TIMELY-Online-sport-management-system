/**
 * Notifications API service
 * Handles delete requests and approval workflow
 */

import { api } from './client';

export interface DeleteRequest {
  type: 'delete_request';
  resource: string;
  resource_id: number;
  requested_by: number;
  reason: string;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  target_users?: number[];
  target_roles?: string[];
}

/**
 * Submit a delete request for approval
 */
export const submitDeleteRequest = async (request: DeleteRequest): Promise<void> => {
  const notificationPayload: NotificationPayload = {
    type: 'delete_request',
    title: `Delete Request: ${request.resource}`,
    message: `User ${request.requested_by} has requested to delete ${request.resource} #${request.resource_id}. Reason: ${request.reason}`,
    data: {
      resource: request.resource,
      resource_id: request.resource_id,
      requested_by: request.requested_by,
      reason: request.reason,
    },
    target_roles: ['ADMIN', 'ORGANIZER'], // Notify admins and organizers
  };

  await api.post('/notifications/send/', notificationPayload);
};

/**
 * Get notifications for the current user
 */
export const getNotifications = async (params?: {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
}) => {
  const response = await api.get('/notifications/', { params });
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/mark-read/`);
};

/**
 * Approve a delete request
 */
export const approveDeleteRequest = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/approve-delete/`);
};

/**
 * Reject a delete request
 */
export const rejectDeleteRequest = async (notificationId: number, reason?: string): Promise<void> => {
  await api.post(`/notifications/${notificationId}/reject-delete/`, { reason });
};
