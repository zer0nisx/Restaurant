import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getDb } from '../db';

let io: SocketIOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('✅ Cliente conectado:', socket.id);

    // Join room by user role
    socket.on('join:role', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`Usuario se unió al room role:${role}`);
    });

    // Join room by user ID
    socket.on('join:user', (userId: number) => {
      socket.join(`user:${userId}`);
      console.log(`Usuario ${userId} se unió a su room personal`);
    });

    // Pedidos en tiempo real
    socket.on('pedido:nuevo', (pedido) => {
      // Notificar a administradores y cocina
      io?.to('role:Administrador').emit('pedido:nuevo', pedido);
      console.log('Nuevo pedido emitido:', pedido.numero_pedido);
    });

    socket.on('pedido:actualizar', (data) => {
      const { pedidoId, estado, usuarioId, repartidorId } = data;

      // Notificar al cliente
      if (usuarioId) {
        io?.to(`user:${usuarioId}`).emit('pedido:actualizado', data);
      }

      // Notificar al repartidor
      if (repartidorId) {
        io?.to(`user:${repartidorId}`).emit('pedido:actualizado', data);
      }

      // Notificar a administradores
      io?.to('role:Administrador').emit('pedido:actualizado', data);

      console.log(`Pedido ${pedidoId} actualizado a estado: ${estado}`);
    });

    // Asignación de repartidor
    socket.on('pedido:asignar_repartidor', (data) => {
      const { pedidoId, repartidorId, pedido } = data;

      // Notificar al repartidor
      io?.to(`user:${repartidorId}`).emit('pedido:asignado', pedido);

      // Notificar a administradores
      io?.to('role:Administrador').emit('pedido:repartidor_asignado', data);

      console.log(`Pedido ${pedidoId} asignado a repartidor ${repartidorId}`);
    });

    // Actualización de ubicación del repartidor
    socket.on('repartidor:ubicacion', (data) => {
      const { repartidorId, pedidoId, lat, lng } = data;

      // Obtener el pedido para notificar al cliente
      const db = getDb();
      const pedido = db.prepare('SELECT id_usuario FROM pedido WHERE id = ?').get(pedidoId) as { id_usuario: number } | undefined;

      if (pedido?.id_usuario) {
        io?.to(`user:${pedido.id_usuario}`).emit('repartidor:ubicacion', data);
      }

      // Notificar a administradores
      io?.to('role:Administrador').emit('repartidor:ubicacion', data);
    });

    // Notificaciones generales
    socket.on('notificacion:enviar', (data) => {
      const { usuarioId, tipo, titulo, mensaje } = data;

      // Guardar notificación en BD
      const db = getDb();
      db.prepare(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
        VALUES (?, ?, ?, ?)
      `).run(usuarioId, tipo, titulo, mensaje);

      // Emitir notificación en tiempo real
      io?.to(`user:${usuarioId}`).emit('notificacion:nueva', data);
    });

    // Reservas en tiempo real
    socket.on('reserva:nueva', (reserva) => {
      io?.to('role:Administrador').emit('reserva:nueva', reserva);
      console.log('Nueva reserva emitida:', reserva.numero_reserva);
    });

    socket.on('reserva:actualizar', (data) => {
      io?.emit('reserva:actualizada', data);
      console.log('Reserva actualizada:', data.reservaId);
    });

    // Actualización de disponibilidad de mesas
    socket.on('mesa:actualizar', (data) => {
      io?.emit('mesa:actualizada', data);
    });

    // Actualización de stock de productos
    socket.on('producto:stock', (data) => {
      io?.to('role:Administrador').emit('producto:stock_bajo', data);
    });

    // Estadísticas en tiempo real
    socket.on('stats:request', async () => {
      const db = getDb();

      const stats = {
        pedidosActivos: db.prepare(`
          SELECT COUNT(*) as count FROM pedido
          WHERE estadoPedido NOT IN ('Entregado', 'Cancelado')
          AND deleted_at IS NULL
        `).get() as { count: number },

        pedidosHoy: db.prepare(`
          SELECT COUNT(*) as count FROM pedido
          WHERE DATE(created_at) = DATE('now')
          AND deleted_at IS NULL
        `).get() as { count: number },

        ventasHoy: db.prepare(`
          SELECT COALESCE(SUM(total), 0) as total FROM pedido
          WHERE DATE(created_at) = DATE('now')
          AND estadoPedido = 'Entregado'
          AND deleted_at IS NULL
        `).get() as { total: number },

        repartidoresDisponibles: db.prepare(`
          SELECT COUNT(*) as count FROM personal_entrega
          WHERE disponibilidad = 1 AND laborando = 1
        `).get() as { count: number },
      };

      socket.emit('stats:update', stats);
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

// Utility functions to emit events from API routes
export function emitPedidoNuevo(pedido: any) {
  io?.to('role:Administrador').emit('pedido:nuevo', pedido);
}

export function emitPedidoActualizado(data: any) {
  if (data.usuarioId) {
    io?.to(`user:${data.usuarioId}`).emit('pedido:actualizado', data);
  }
  if (data.repartidorId) {
    io?.to(`user:${data.repartidorId}`).emit('pedido:actualizado', data);
  }
  io?.to('role:Administrador').emit('pedido:actualizado', data);
}

export function emitNotificacion(usuarioId: number, data: any) {
  io?.to(`user:${usuarioId}`).emit('notificacion:nueva', data);
}

export function emitReservaActualizada(data: any) {
  io?.emit('reserva:actualizada', data);
}

export function emitStatsUpdate(stats: any) {
  io?.emit('stats:update', stats);
}
