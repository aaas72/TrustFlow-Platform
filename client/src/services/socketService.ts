import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            this.registerUser();
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (err: Error) => {
            console.error('Socket connection error:', err);
        });
    }

    registerUser() {
        const raw = localStorage.getItem('user');
        if (raw && this.socket) {
            try {
                const user = JSON.parse(raw);
                if (user.id) {
                    console.log('Registering socket for user:', user.id);
                    this.socket.emit('register', user.id);
                }
            } catch (e) {
                console.error('Socket registration failed:', e);
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (!this.socket) this.connect();
        this.socket?.on(event, callback);
    }

    off(event: string, callback?: (...args: any[]) => void) {
        if (this.socket) {
            (this.socket as any).off(event, callback);
        }
    }

    emit(event: string, ...args: any[]) {
        if (!this.socket) this.connect();
        this.socket?.emit(event, ...args);
    }
}

export const socketService = new SocketService();


