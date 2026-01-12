import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { Role } from '@prisma/client';
import prisma from './prisma.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: Role;
}

class WebSocketService {
  private io: SocketServer | null = null;
  private connectedAdmins: Map<string, AuthenticatedSocket> = new Map();

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized');
  }

  /**
   * Authenticate socket connection via JWT
   */
  private authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): void {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn('WebSocket connection rejected: No token provided', { socketId: socket.id });
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: Role };
      
      // Only allow ADMIN and SUPER_ADMIN
      if (decoded.role !== Role.ADMIN && decoded.role !== Role.SUPER_ADMIN) {
        logger.warn('WebSocket connection rejected: Not an admin', { socketId: socket.id, role: decoded.role });
        return next(new Error('Admin access required'));
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      logger.warn('WebSocket connection rejected: Invalid token', { socketId: socket.id, error });
      next(new Error('Invalid token'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    if (!socket.userId) {
      socket.disconnect();
      return;
    }

    this.connectedAdmins.set(socket.userId, socket);
    logger.info('Admin connected to WebSocket', { 
      userId: socket.userId, 
      role: socket.userRole,
      socketId: socket.id,
      totalConnected: this.connectedAdmins.size 
    });

    // Send welcome message
    socket.emit('admin:connected', {
      message: 'Connected to admin notifications',
      userId: socket.userId,
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedAdmins.delete(socket.userId!);
      logger.info('Admin disconnected from WebSocket', { 
        userId: socket.userId,
        totalConnected: this.connectedAdmins.size 
      });
    });

    // Handle ping/pong for connection health
    socket.on('admin:ping', () => {
      socket.emit('admin:pong');
    });
  }

  /**
   * Emit notification to all connected admins
   */
  emitAdminNotification(notification: {
    id: string;
    type: 'USER_REGISTERED' | 'APPOINTMENT' | 'BREAKDOWN' | 'GENERAL';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    createdAt: string;
  }): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot emit notification');
      return;
    }

    logger.info('Emitting admin notification via WebSocket', {
      notificationId: notification.id,
      type: notification.type,
      connectedAdmins: this.connectedAdmins.size,
    });

    // Emit to all connected admins
    this.io.emit('admin:notification', notification);
  }

  /**
   * Get number of connected admins
   */
  getConnectedAdminsCount(): number {
    return this.connectedAdmins.size;
  }

  /**
   * Get Socket.io instance (for advanced usage)
   */
  getIO(): SocketServer | null {
    return this.io;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;



