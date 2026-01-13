'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket/client';

export default function Home() {
  const router = useRouter();
  const { isConnected } = useSocket();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Redirigir según rol
        switch (data.user.rol) {
          case 'Administrador':
            router.push('/admin/dashboard');
            break;
          case 'Repartidor':
            router.push('/repartidor/dashboard');
            break;
          case 'Cliente':
            router.push('/cliente/menu');
            break;
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-4xl text-white">🍽️</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Restaurant Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema completo de gestión de restaurante con delivery y reservas en tiempo real
          </p>

          {/* Connection Status */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
            </span>
          </div>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <FeatureCard
            icon="📦"
            title="Sistema de Pedidos"
            description="Gestión de pedidos en tiempo real con actualizaciones instantáneas"
          />
          <FeatureCard
            icon="🚚"
            title="Delivery Tracking"
            description="Seguimiento en vivo de repartidores y entregas"
          />
          <FeatureCard
            icon="🪑"
            title="Reservas de Mesas"
            description="Sistema completo de reservas con disponibilidad en tiempo real"
          />
          <FeatureCard
            icon="📊"
            title="Dashboard Administrativo"
            description="Panel de control con estadísticas y métricas en vivo"
          />
          <FeatureCard
            icon="👥"
            title="Multi-Rol"
            description="Perfiles para administradores, repartidores y clientes"
          />
          <FeatureCard
            icon="🔔"
            title="Notificaciones"
            description="Alertas en tiempo real para todos los eventos importantes"
          />
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-orange-200"
            >
              Registrarse
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Sistema desarrollado con Next.js, SQLite, Socket.IO y TypeScript
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Tecnologías Utilizadas
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <TechBadge name="Next.js" />
            <TechBadge name="TypeScript" />
            <TechBadge name="SQLite" />
            <TechBadge name="Socket.IO" />
            <TechBadge name="Tailwind CSS" />
            <TechBadge name="shadcn/ui" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg text-orange-700 font-medium text-sm">
      {name}
    </div>
  );
}
