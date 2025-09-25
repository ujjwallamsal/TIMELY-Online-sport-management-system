// Re-export useEventStream for backward compatibility
export { useEventStream as useRealtime } from './useEventStream';

// Hook for event-specific realtime updates
export const useEventRealtime = (eventId?: number, enabled: boolean = true) => {
  const { useEventStream } = require('./useEventStream');
  return useEventStream({
    eventId: eventId || 0,
    enabled: enabled && !!eventId,
  });
};

// Hook for general realtime updates - uses polling fallback
export const useGeneralRealtime = (enabled: boolean = true) => {
  const { useEventStream } = require('./useEventStream');
  return useEventStream({
    eventId: 0, // Will fallback to polling
    enabled,
  });
};
