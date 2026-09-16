import { io, Socket } from 'socket.io-client';

// Socket.IO connects to the backend directly; the Vite dev server only proxies REST calls.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

type SocketListener = (data: any) => void;

class SocketClientService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<SocketListener>>();
  private token: string | null = null;

  public connect(token: string): void {
    if (this.socket?.connected && this.token === token) return;
    this.disconnect();
    this.token = token;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to DMetrics live updates');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from DMetrics live updates');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    // Register all internal listeners with the socket instance
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => {
        this.socket?.on(event, cb);
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
  }

  public on(event: string, callback: SocketListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const callbacks = this.listeners.get(event)!;
    if (callbacks.has(callback)) return;
    callbacks.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback: SocketListener): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) this.listeners.delete(event);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketClientService();
