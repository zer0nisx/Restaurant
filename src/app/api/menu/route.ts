import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria_id = searchParams.get('categoria_id');
    const destacado = searchParams.get('destacado');

    const db = getDb();
    let query = `
      SELECT
        m.id,
        m.nombre,
        m.descripcion,
        m.precio,
        m.categoria_id,
        m.subcategoria_id,
        m.activo,
        m.destacado,
        m.ruta_imagen,
        m.tiempo_preparacion,
        c.nombre as categoria_nombre,
        s.nombre as subcategoria_nombre
      FROM menu m
      JOIN categoria c ON m.categoria_id = c.id
      LEFT JOIN subcategoria s ON m.subcategoria_id = s.id
      WHERE m.deleted_at IS NULL AND m.activo = 1
    `;

    const params: any[] = [];

    if (categoria_id) {
      query += ' AND m.categoria_id = ?';
      params.push(categoria_id);
    }

    if (destacado === '1') {
      query += ' AND m.destacado = 1';
    }

    query += ' ORDER BY c.orden, m.nombre';

    const items = db.prepare(query).all(...params);

    return NextResponse.json({ menu: items });
  } catch (error) {
    console.error('Error obteniendo menú:', error);
    return NextResponse.json(
      { error: 'Error al obtener menú' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['Administrador']);
    const body = await request.json();

    const {
      nombre,
      descripcion,
      precio,
      categoria_id,
      subcategoria_id,
      destacado = 0,
      ruta_imagen,
      tiempo_preparacion = 30,
    } = body;

    if (!nombre || !precio || !categoria_id) {
      return NextResponse.json(
        { error: 'Nombre, precio y categoría son requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO menu (
        nombre, descripcion, precio, categoria_id, subcategoria_id,
        destacado, ruta_imagen, tiempo_preparacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nombre,
      descripcion || null,
      precio,
      categoria_id,
      subcategoria_id || null,
      destacado,
      ruta_imagen || null,
      tiempo_preparacion
    );

    const item = db.prepare(`
      SELECT m.*, c.nombre as categoria_nombre, s.nombre as subcategoria_nombre
      FROM menu m
      JOIN categoria c ON m.categoria_id = c.id
      LEFT JOIN subcategoria s ON m.subcategoria_id = s.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      message: 'Item de menú creado exitosamente',
      item,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando item de menú:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear item de menú' },
      { status: 500 }
    );
  }
}
