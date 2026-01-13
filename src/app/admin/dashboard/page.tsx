'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  ChefHat,
} from 'lucide-react';

interface Stats {
  pedidosHoy: number;
  pedidosPendientes: number;
  pedidosEnCamino: number;
  pedidosCompletados: number;
  ventasHoy: number;
  repartidoresActivos: number;
  reservasHoy: number;
}

interface Pedido {
  id: number;
  numero_pedido: string;
  nombreCliente: string;
  estadoPedido: string;
  total: number;
  created_at: string;
  tipoEntrega: string;
}

const estadoColors: Record<string, string> = {
  'Ordenado': 'bg-blue-100 text-blue-800',
  'En preparación': 'bg-yellow-100 text-yellow-800',
  'Listo para entrega': 'bg-purple-100 text-purple-800',
  'En camino': 'bg-orange-100 text-orange-800',
  'Entregado': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [stats, setStats] = useState<Stats>({
    pedidosHoy: 0,
    pedidosPendientes: 0,
    pedidosEnCamino: 0,
    pedidosCompletados: 0,
    ventasHoy: 0,
    repartidoresActivos: 0,
    reservasHoy: 0,
  });
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('pedido:nuevo', (pedido: Pedido) => {
        setPedidosRecientes((prev) => [pedido, ...prev.slice(0, 9)]);
        setStats((prev) => ({
          ...prev,
          pedidosHoy: prev.pedidosHoy + 1,
          pedidosPendientes: prev.pedidosPendientes + 1,
        }));
      });

      socket.on('pedido:actualizado', (data: any) => {
        setPedidosRecientes((prev) =>
          prev.map((p) =>
            p.id === data.pedidoId ? { ...p, estadoPedido: data.estado } : p
          )
        );
      });

      return () => {
        socket.off('pedido:nuevo');
        socket.off('pedido:actualizado');
      };
    }
  }, [socket]);

  async function fetchData() {
    try {
      const [statsRes, pedidosRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/pedidos?limit=10'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (pedidosRes.ok) {
        const pedidosData = await pedidosRes.json();
        setPedidosRecientes(pedidosData.pedidos || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen de operaciones del día</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pedidos Hoy"
          value={stats.pedidosHoy}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="orange"
          trend="+12%"
        />
        <StatsCard
          title="Ventas del Día"
          value={`$${stats.ventasHoy.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
          trend="+8%"
        />
        <StatsCard
          title="Repartidores Activos"
          value={stats.repartidoresActivos}
          icon={<Truck className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Reservas Hoy"
          value={stats.reservasHoy}
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          label="Pendientes"
          value={stats.pedidosPendientes}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatusCard
          label="En Preparación"
          value={0}
          icon={<ChefHat className="h-5 w-5" />}
          color="orange"
        />
        <StatusCard
          label="En Camino"
          value={stats.pedidosEnCamino}
          icon={<Truck className="h-5 w-5" />}
          color="blue"
        />
        <StatusCard
          label="Completados"
          value={stats.pedidosCompletados}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos pedidos del sistema</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <a href="/admin/pedidos">Ver todos</a>
          </Button>
        </CardHeader>
        <CardContent>
          {pedidosRecientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay pedidos recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosRecientes.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-medium">
                      {pedido.nombreCliente.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        #{pedido.numero_pedido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pedido.nombreCliente}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={estadoColors[pedido.estadoPedido] || 'bg-gray-100'}>
                      {pedido.estadoPedido}
                    </Badge>
                    <Badge variant="outline">{pedido.tipoEntrega}</Badge>
                    <span className="font-semibold text-gray-900">
                      ${pedido.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'orange' | 'green' | 'blue' | 'purple';
  trend?: string;
}) {
  const colorClasses = {
    orange: 'from-orange-500 to-red-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'yellow' | 'orange' | 'blue' | 'green';
}) {
  const bgColors = {
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  };

  const iconColors = {
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[color]}`}>
      <div className={iconColors[color]}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
