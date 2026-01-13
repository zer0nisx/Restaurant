'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Conectado al servidor Socket.IO');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado del servidor Socket.IO');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de SocketProvider');
  }
  return context;
}

// Custom hooks for specific features
export function usePedidosRealTime(callback: (pedido: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('pedido:nuevo', callback);
    socket.on('pedido:actualizado', callback);

    return () => {
      socket.off('pedido:nuevo', callback);
      socket.off('pedido:actualizado', callback);
    };
  }, [socket, callback]);
}

export function useNotificaciones(userId: number, callback: (notificacion: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !userId) return;

    socket.emit('join:user', userId);
    socket.on('notificacion:nueva', callback);

    return () => {
      socket.off('notificacion:nueva', callback);
    };
  }, [socket, userId, callback]);
}

export function useRepartidorTracking(pedidoId: number, callback: (ubicacion: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !pedidoId) return;

    socket.on('repartidor:ubicacion', (data: any) => {
      if (data.pedidoId === pedidoId) {
        callback(data);
      }
    });

    return () => {
      socket.off('repartidor:ubicacion');
    };
  }, [socket, pedidoId, callback]);
}

export function useStats(callback: (stats: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Request initial stats
    socket.emit('stats:request');

    // Listen for updates
    socket.on('stats:update', callback);

    // Request stats every 30 seconds
    const interval = setInterval(() => {
      socket.emit('stats:request');
    }, 30000);

    return () => {
      socket.off('stats:update', callback);
      clearInterval(interval);
    };
  }, [socket, callback]);
}

export function useReservasRealTime(callback: (reserva: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('reserva:nueva', callback);
    socket.on('reserva:actualizada', callback);

    return () => {
      socket.off('reserva:nueva', callback);
      socket.off('reserva:actualizada', callback);
    };
  }, [socket, callback]);
}

export function joinRoleRoom(socket: Socket | null, role: string) {
  if (socket) {
    socket.emit('join:role', role);
  }
}

export function joinUserRoom(socket: Socket | null, userId: number) {
  if (socket) {
    socket.emit('join:user', userId);
  }
}
