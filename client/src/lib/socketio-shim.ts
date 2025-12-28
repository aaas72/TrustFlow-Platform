// Lightweight runtime shim for socket.io-client to avoid build errors
// when the package is not installed. It keeps the app running without
// real-time features. Install the real client with:
//   npm i socket.io-client

export type Socket = {
  on: (...args: any[]) => any;
  emit: (...args: any[]) => any;
  disconnect: () => void;
  connected?: boolean;
  id?: string;
};

export function io(_url: string, _opts?: any): Socket {
  const handlers: Record<string, Function[]> = {};
  const socket: Socket = {
    on: (event: string, cb: Function) => {
      handlers[event] = handlers[event] || [];
      handlers[event].push(cb);
      return socket;
    },
    emit: (_event: string, _payload?: any) => {
      // No-op in shim; just warn once
      if (!warned) {
        console.warn('[socketio-shim] Real-time disabled. Install "socket.io-client".');
        warned = true;
      }
      return socket;
    },
    disconnect: () => {
      Object.keys(handlers).forEach(k => delete handlers[k]);
    },
    connected: false,
    id: undefined,
  };

  // Simulate immediate "connect" event so UI relying on it doesn't break
  setTimeout(() => {
    socket.connected = false; // stays false in shim
    (handlers['connect'] || []).forEach(fn => {
      try { fn(); } catch {}
    });
  }, 0);

  return socket;
}

let warned = false;