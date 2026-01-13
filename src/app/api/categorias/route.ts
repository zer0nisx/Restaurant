import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const categorias = db.prepare(`
      SELECT id, nombre, descripcion, orden, activo
      FROM categoria
      WHERE activo = 1
      ORDER BY orden, nombre
    `).all();

    // Obtener subcategorías para cada categoría
    const categoriasConSubs = categorias.map((categoria: any) => {
      const subcategorias = db.prepare(`
        SELECT id, nombre, orden
        FROM subcategoria
        WHERE categoria_id = ? AND activo = 1
        ORDER BY orden, nombre
      `).all(categoria.id);

      return {
        ...categoria,
        subcategorias,
      };
    });

    return NextResponse.json({ categorias: categoriasConSubs });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
