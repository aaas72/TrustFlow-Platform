// Temporary type shim to silence TS until the package is installed.
// Install the real dependency with: npm i socket.io-client
declare module 'socket.io-client' {
  export type Socket = {
    on: (...args: any[]) => any;
    emit: (...args: any[]) => any;
    disconnect: () => void;
    connected?: boolean;
    id?: string;
  };
  export function io(url: string, opts?: any): Socket;
}