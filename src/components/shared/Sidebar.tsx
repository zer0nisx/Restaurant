'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Truck,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  BarChart3,
  Package,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  role: 'Administrador' | 'Repartidor' | 'Cliente';
  user: {
    id: number;
    nombre: string;
    rol: string;
    correo: string;
  };
  notificationCount?: number;
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/menu', label: 'Menú', icon: UtensilsCrossed },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/repartidores', label: 'Repartidores', icon: Truck },
  { href: '/admin/reservas', label: 'Reservas', icon: Calendar },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/facturas', label: 'Facturas', icon: FileText },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

const repartidorLinks = [
  { href: '/repartidor/dashboard', label: 'Dashboard', icon: Home },
  { href: '/repartidor/pedidos', label: 'Mis Pedidos', icon: ShoppingCart },
  { href: '/repartidor/historial', label: 'Historial', icon: FileText },
];

const clienteLinks = [
  { href: '/cliente/menu', label: 'Menú', icon: UtensilsCrossed },
  { href: '/cliente/pedidos', label: 'Mis Pedidos', icon: ShoppingCart },
  { href: '/cliente/reservas', label: 'Reservas', icon: Calendar },
  { href: '/cliente/perfil', label: 'Mi Perfil', icon: Users },
];

export function Sidebar({ role, user, notificationCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = role === 'Administrador'
    ? adminLinks
    : role === 'Repartidor'
    ? repartidorLinks
    : clienteLinks;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Restaurant</h1>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'mx-auto mt-2')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <link.icon className={cn('h-5 w-5', collapsed && 'mx-auto')} />
              {!collapsed && <span className="font-medium">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Notifications */}
      <div className="p-4">
        <Link
          href={role === 'Administrador' ? '/admin/notificaciones' : `/${role.toLowerCase()}/notificaciones`}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 relative'
          )}
        >
          <Bell className={cn('h-5 w-5', collapsed && 'mx-auto')} />
          {!collapsed && <span className="font-medium">Notificaciones</span>}
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Link>
      </div>

      <Separator />

      {/* User section */}
      <div className="p-4">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="font-medium text-gray-900 truncate">{user.nombre}</p>
            <p className="text-xs text-gray-500 truncate">{user.correo}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
