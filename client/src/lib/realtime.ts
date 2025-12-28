import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(userId?: number | string): Socket {
  if (socket) return socket;
  socket = io('http://localhost:3000', {
    transports: ['websocket'],
  });
  if (userId) {
    // Emit register after connect as well
    socket.emit('register', userId);
    socket.on('connect', () => {
      socket?.emit('register', userId);
    });
  }
  return socket;
}

export function cleanupSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}