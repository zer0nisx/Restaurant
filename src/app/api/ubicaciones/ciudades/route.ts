import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const ciudades = db.prepare(`
      SELECT id, nombre, estado, codigoPostal
      FROM ciudad
      WHERE activo = 1
      ORDER BY nombre
    `).all();

    return NextResponse.json({ ciudades });
  } catch (error) {
    console.error('Error obteniendo ciudades:', error);
    return NextResponse.json(
      { error: 'Error al obtener ciudades' },
      { status: 500 }
    );
  }
}
