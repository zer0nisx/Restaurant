'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { useSocket } from '@/lib/socket/client';

interface User {
  id: number;
  nombre: string;
  rol: string;
  correo: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join:role', 'Administrador');
      socket.emit('join:user', user.id);

      socket.on('pedido:nuevo', () => {
        setNotificationCount(prev => prev + 1);
      });

      socket.on('reserva:nueva', () => {
        setNotificationCount(prev => prev + 1);
      });

      return () => {
        socket.off('pedido:nuevo');
        socket.off('reserva:nueva');
      };
    }
  }, [socket, user]);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user.rol !== 'Administrador') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role="Administrador"
        user={user}
        notificationCount={notificationCount}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Connection status bar */}
          <div className="mb-4 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'En tiempo real' : 'Desconectado'}
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
