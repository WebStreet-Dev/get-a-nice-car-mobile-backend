import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminNotification } from '../types';

interface UseWebSocketOptions {
  token: string | null;
  onNotification?: (notification: AdminNotification) => void;
  enabled?: boolean;
}

export function useWebSocket({ token, onNotification, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Handle connection
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    // Handle admin notification
    socket.on('admin:notification', (notification: AdminNotification) => {
      console.log('Received admin notification:', notification);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Call custom handler if provided
      if (onNotification) {
        onNotification(notification);
      }
    });

    // Handle connection confirmation
    socket.on('admin:connected', (data) => {
      console.log('Admin connected to WebSocket:', data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [token, enabled, onNotification, queryClient]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}



