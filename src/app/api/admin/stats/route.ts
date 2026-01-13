import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload || payload.rol !== 'Administrador') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Pedidos de hoy
    const pedidosHoyResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM pedido
         WHERE DATE(created_at) = ? AND deleted_at IS NULL`
      )
      .get(today) as { count: number };

    // Pedidos pendientes
    const pedidosPendientesResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM pedido
         WHERE estadoPedido IN ('Ordenado', 'En preparación')
         AND deleted_at IS NULL`
      )
      .get() as { count: number };

    // Pedidos en camino
    const pedidosEnCaminoResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM pedido
         WHERE estadoPedido = 'En camino' AND deleted_at IS NULL`
      )
      .get() as { count: number };

    // Pedidos completados hoy
    const pedidosCompletadosResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM pedido
         WHERE estadoPedido = 'Entregado'
         AND DATE(created_at) = ?
         AND deleted_at IS NULL`
      )
      .get(today) as { count: number };

    // Ventas del día
    const ventasHoyResult = db
      .prepare(
        `SELECT COALESCE(SUM(total), 0) as total FROM pedido
         WHERE DATE(created_at) = ?
         AND estadoPedido NOT IN ('Cancelado')
         AND deleted_at IS NULL`
      )
      .get(today) as { total: number };

    // Repartidores activos
    const repartidoresActivosResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM personal_entrega
         WHERE disponibilidad = 1 AND laborando = 1`
      )
      .get() as { count: number };

    // Reservas de hoy
    const reservasHoyResult = db
      .prepare(
        `SELECT COUNT(*) as count FROM reservas
         WHERE DATE(created_at) = ?
         AND estado_transaccion = 'confirmada'`
      )
      .get(today) as { count: number };

    return NextResponse.json({
      pedidosHoy: pedidosHoyResult.count,
      pedidosPendientes: pedidosPendientesResult.count,
      pedidosEnCamino: pedidosEnCaminoResult.count,
      pedidosCompletados: pedidosCompletadosResult.count,
      ventasHoy: ventasHoyResult.total,
      repartidoresActivos: repartidoresActivosResult.count,
      reservasHoy: reservasHoyResult.count,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
