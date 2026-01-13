import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const pedido = db.prepare(`
      SELECT
        p.*,
        u.nombre as usuario_nombre,
        u.correo as usuario_correo,
        pe.nombre as repartidor_nombre,
        pe.apellido as repartidor_apellido,
        pe.telefono as repartidor_telefono,
        c.nombre as ciudad_nombre,
        m.nombre as municipio_nombre
      FROM pedido p
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN personal_entrega pe ON p.personal_entrega_id = pe.id
      LEFT JOIN ciudad c ON p.ciudad_id = c.id
      LEFT JOIN municipio m ON p.municipio_id = m.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).get(id) as any;

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Obtener detalles
    const detalles = db.prepare(`
      SELECT
        dp.*,
        COALESCE(pr.nombre, m.nombre) as item_nombre,
        COALESCE(pr.descripcion, m.descripcion) as item_descripcion
      FROM detalle_pedido dp
      LEFT JOIN producto pr ON dp.producto_id = pr.id
      LEFT JOIN menu m ON dp.menu_id = m.id
      WHERE dp.pedido_id = ?
    `).all(id);

    pedido.detalles = detalles;

    return NextResponse.json({ pedido });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { estadoPedido, estadoEntrega, personal_entrega_id, tiempo_estimado } = body;

    const db = getDb();

    // Verificar que el pedido existe
    const pedido = db.prepare('SELECT * FROM pedido WHERE id = ? AND deleted_at IS NULL').get(id) as any;

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Construir query de actualización
    const updates: string[] = [];
    const params: any[] = [];

    if (estadoPedido) {
      updates.push('estadoPedido = ?');
      params.push(estadoPedido);

      // Si se marca como entregado, actualizar fecha de entrega
      if (estadoPedido === 'Entregado') {
        updates.push('fechaHoraEntrega = CURRENT_TIMESTAMP');
      }
    }

    if (estadoEntrega) {
      updates.push('estadoEntrega = ?');
      params.push(estadoEntrega);
    }

    if (personal_entrega_id !== undefined) {
      updates.push('personal_entrega_id = ?');
      params.push(personal_entrega_id || null);

      // Si se asigna repartidor, actualizar estado
      if (personal_entrega_id && estadoPedido !== 'Cancelado') {
        updates.push('estadoPedido = ?');
        params.push('En preparación');
      }
    }

    if (tiempo_estimado) {
      updates.push('tiempo_estimado = ?');
      params.push(tiempo_estimado);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    params.push(id);

    // Actualizar pedido
    db.prepare(`
      UPDATE pedido SET ${updates.join(', ')} WHERE id = ?
    `).run(...params);

    // Obtener pedido actualizado
    const pedidoActualizado = db.prepare(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM pedido p
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      WHERE p.id = ?
    `).get(id) as any;

    // Emitir evento de socket
    if (global.io) {
      const eventData = {
        pedidoId: id,
        estadoPedido: pedidoActualizado.estadoPedido,
        estadoEntrega: pedidoActualizado.estadoEntrega,
        usuarioId: pedidoActualizado.id_usuario,
        repartidorId: pedidoActualizado.personal_entrega_id,
        pedido: pedidoActualizado,
      };

      // Notificar al cliente
      if (pedidoActualizado.id_usuario) {
        global.io.to(`user:${pedidoActualizado.id_usuario}`).emit('pedido:actualizado', eventData);

        // Crear notificación
        db.prepare(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
          VALUES (?, 'Pedido', ?, ?)
        `).run(
          pedidoActualizado.id_usuario,
          'Estado de pedido actualizado',
          `Tu pedido ${pedidoActualizado.numero_pedido} está ahora: ${pedidoActualizado.estadoPedido}`
        );
      }

      // Notificar al repartidor si fue asignado
      if (personal_entrega_id && personal_entrega_id !== pedido.personal_entrega_id) {
        global.io.to(`user:${personal_entrega_id}`).emit('pedido:asignado', eventData);

        db.prepare(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
          VALUES (?, 'Pedido', ?, ?)
        `).run(
          personal_entrega_id,
          'Nuevo pedido asignado',
          `Se te ha asignado el pedido ${pedidoActualizado.numero_pedido}`
        );
      }

      // Notificar a administradores
      global.io.to('role:Administrador').emit('pedido:actualizado', eventData);
    }

    return NextResponse.json({
      message: 'Pedido actualizado exitosamente',
      pedido: pedidoActualizado,
    });

  } catch (error: any) {
    console.error('Error actualizando pedido:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar pedido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(['Administrador']);
    const { id } = await params;

    const db = getDb();

    // Soft delete
    db.prepare(`
      UPDATE pedido SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    return NextResponse.json({
      message: 'Pedido eliminado exitosamente',
    });

  } catch (error: any) {
    console.error('Error eliminando pedido:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar pedido' },
      { status: 500 }
    );
  }
}
