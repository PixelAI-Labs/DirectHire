import { io, Socket } from 'socket.io-client';

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
// FastAPI typically runs on 8000, we remove /api if present for socket connection
const socketUrl = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');

let notificationSocket: Socket | null = null;
let activeUserId: string | null = null;

export const getSocket = (userId: string | undefined): Socket | null => {
  if (!userId) return null;

  if (notificationSocket && activeUserId !== userId) {
    notificationSocket.disconnect();
    notificationSocket = null;
  }

  if (!notificationSocket) {
    activeUserId = userId;
    notificationSocket = io(socketUrl, {
      autoConnect: false,
      auth: { userId },
      transports: ['websocket', 'polling'],
    });
  }

  notificationSocket.auth = { userId };
  if (!notificationSocket.connected) {
    notificationSocket.connect();
  }

  return notificationSocket;
};

export const disconnectSocket = () => {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
    activeUserId = null;
  }
};
