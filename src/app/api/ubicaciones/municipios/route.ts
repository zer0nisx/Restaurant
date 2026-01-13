import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ciudad_id = searchParams.get('ciudad_id');

    if (!ciudad_id) {
      return NextResponse.json(
        { error: 'ciudad_id es requerido' },
        { status: 400 }
      );
    }

    const db = getDb();

    const municipios = db.prepare(`
      SELECT id, nombre
      FROM municipio
      WHERE ciudad_id = ? AND activo = 1
      ORDER BY nombre
    `).all(ciudad_id);

    return NextResponse.json({ municipios });
  } catch (error) {
    console.error('Error obteniendo municipios:', error);
    return NextResponse.json(
      { error: 'Error al obtener municipios' },
      { status: 500 }
    );
  }
}
