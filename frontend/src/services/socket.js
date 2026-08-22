import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false, // Don't connect until the provider mounts
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
