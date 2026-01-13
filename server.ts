import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Store io instance globally
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log('✅ Cliente conectado:', socket.id);

    socket.on('join:role', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`Usuario se unió al room role:${role}`);
    });

    socket.on('join:user', (userId: number) => {
      socket.join(`user:${userId}`);
      console.log(`Usuario ${userId} se unió a su room personal`);
    });

    socket.on('pedido:nuevo', (pedido: any) => {
      io.to('role:Administrador').emit('pedido:nuevo', pedido);
      console.log('Nuevo pedido emitido:', pedido.numero_pedido);
    });

    socket.on('pedido:actualizar', (data: any) => {
      const { usuarioId, repartidorId } = data;

      if (usuarioId) {
        io.to(`user:${usuarioId}`).emit('pedido:actualizado', data);
      }

      if (repartidorId) {
        io.to(`user:${repartidorId}`).emit('pedido:actualizado', data);
      }

      io.to('role:Administrador').emit('pedido:actualizado', data);
    });

    socket.on('pedido:asignar_repartidor', (data: any) => {
      const { repartidorId } = data;
      io.to(`user:${repartidorId}`).emit('pedido:asignado', data);
      io.to('role:Administrador').emit('pedido:repartidor_asignado', data);
    });

    socket.on('repartidor:ubicacion', (data: any) => {
      const { pedido } = data;
      if (pedido?.id_usuario) {
        io.to(`user:${pedido.id_usuario}`).emit('repartidor:ubicacion', data);
      }
      io.to('role:Administrador').emit('repartidor:ubicacion', data);
    });

    socket.on('notificacion:enviar', (data: any) => {
      const { usuarioId } = data;
      io.to(`user:${usuarioId}`).emit('notificacion:nueva', data);
    });

    socket.on('reserva:nueva', (reserva: any) => {
      io.to('role:Administrador').emit('reserva:nueva', reserva);
    });

    socket.on('reserva:actualizar', (data: any) => {
      io.emit('reserva:actualizada', data);
    });

    socket.on('mesa:actualizar', (data: any) => {
      io.emit('mesa:actualizada', data);
    });

    socket.on('stats:request', () => {
      socket.emit('stats:requested');
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
    });
  });

  // Initialize database
  const { initializeDatabase } = await import('./src/lib/db/index.js');
  initializeDatabase();

  // Seed demo data
  try {
    const seedModule = await import('./scripts/seed-demo-data.js');
    await seedModule.default();
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
🚀 Servidor iniciado exitosamente
📍 URL: http://${hostname}:${port}
🔌 Socket.IO: Activo
🗄️  Base de datos: SQLite inicializada
      `);
    });
});
