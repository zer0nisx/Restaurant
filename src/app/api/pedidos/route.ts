import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateNumero } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const db = getDb();
    let query = `
      SELECT
        p.*,
        u.nombre as usuario_nombre,
        pe.nombre as repartidor_nombre,
        pe.apellido as repartidor_apellido,
        c.nombre as ciudad_nombre,
        m.nombre as municipio_nombre
      FROM pedido p
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN personal_entrega pe ON p.personal_entrega_id = pe.id
      LEFT JOIN ciudad c ON p.ciudad_id = c.id
      LEFT JOIN municipio m ON p.municipio_id = m.id
      WHERE p.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Filtrar por usuario si no es admin
    if (session && session.rol === 'Cliente') {
      query += ' AND p.id_usuario = ?';
      params.push(session.id);
    } else if (session && session.rol === 'Repartidor') {
      query += ' AND p.personal_entrega_id = ?';
      params.push(session.id);
    }

    // Filtros adicionales
    if (estado) {
      query += ' AND p.estadoPedido = ?';
      params.push(estado);
    }

    if (tipo) {
      query += ' AND p.tipoEntrega = ?';
      params.push(tipo);
    }

    query += ' ORDER BY p.created_at DESC LIMIT 100';

    const pedidos = db.prepare(query).all(...params);

    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const {
      tipoEntrega,
      ciudad_id,
      municipio_id,
      calle,
      residencia,
      nombreCliente,
      telefonoCliente,
      descripcion,
      metodoPago,
      items, // Array of { menu_id or producto_id, cantidad, precio }
    } = body;

    // Validaciones
    if (!tipoEntrega || !calle || !residencia || !nombreCliente || !telefonoCliente || !metodoPago || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Calcular total
    let total = 0;
    const detalles = [];

    for (const item of items) {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      detalles.push({
        ...item,
        subtotal,
      });
    }

    // Generar número de pedido
    const numero_pedido = generateNumero('PED');

    // Crear pedido
    const insertPedido = db.prepare(`
      INSERT INTO pedido (
        numero_pedido, id_usuario, tipoEntrega, ciudad_id, municipio_id,
        calle, residencia, nombreCliente, telefonoCliente, descripcion,
        metodoPago, total, estadoPedido, estadoEntrega
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ordenado', 'Pendiente')
    `);

    const result = insertPedido.run(
      numero_pedido,
      session?.id || null,
      tipoEntrega,
      ciudad_id || null,
      municipio_id || null,
      calle,
      residencia,
      nombreCliente,
      telefonoCliente,
      descripcion || null,
      metodoPago,
      total
    );

    const pedidoId = Number(result.lastInsertRowid);

    // Crear detalles del pedido
    const insertDetalle = db.prepare(`
      INSERT INTO detalle_pedido (cantidad, subtotal, pedido_id, producto_id, menu_id, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const detalle of detalles) {
      insertDetalle.run(
        detalle.cantidad,
        detalle.subtotal,
        pedidoId,
        detalle.producto_id || null,
        detalle.menu_id || null,
        detalle.notas || null
      );
    }

    // Obtener pedido completo
    const pedido = db.prepare(`
      SELECT p.*,
        (SELECT json_group_array(
          json_object(
            'id', dp.id,
            'cantidad', dp.cantidad,
            'subtotal', dp.subtotal,
            'producto_nombre', pr.nombre,
            'menu_nombre', m.nombre
          )
        ) FROM detalle_pedido dp
        LEFT JOIN producto pr ON dp.producto_id = pr.id
        LEFT JOIN menu m ON dp.menu_id = m.id
        WHERE dp.pedido_id = p.id) as detalles
      FROM pedido p
      WHERE p.id = ?
    `).get(pedidoId) as any;

    // Emitir evento de socket
    if (global.io) {
      global.io.to('role:Administrador').emit('pedido:nuevo', pedido);

      // Crear notificación
      db.prepare(`
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
        VALUES (?, 'Pedido', ?, ?)
      `).run(
        session?.id || 0,
        'Pedido creado',
        `Tu pedido ${numero_pedido} ha sido creado exitosamente`
      );
    }

    return NextResponse.json({
      message: 'Pedido creado exitosamente',
      pedido,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando pedido:', error);
    return NextResponse.json(
      { error: 'Error al crear pedido' },
      { status: 500 }
    );
  }
}
