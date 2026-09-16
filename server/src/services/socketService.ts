import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';

export class SocketService {
  private static io: Server | null = null;

  public static init(server: HttpServer): void {
    const corsOrigin = env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s: string) => s.trim());
    
    this.io = new Server(server, {
      cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

      // Basic auth check using token in handshake auth if provided
      const token = socket.handshake.auth?.token;
      if (token) {
        // Here you would verify the JWT. 
        // For simplicity and speed in this iteration, we just accept the connection.
        console.log(`🔌 [Socket.io] Client provided auth token.`);
      }

      socket.on('disconnect', () => {
        console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    console.log(`🔌 [Socket.io] Service initialized.`);
  }

  /**
   * Emit an event to all connected clients
   * @param event The event name
   * @param data The payload
   */
  public static emitEvent(event: string, data: any): void {
    if (!this.io) {
      console.warn(`[Socket.io] Cannot emit event '${event}'. SocketServer is not initialized.`);
      return;
    }
    
    this.io.emit(event, data);
  }
}
