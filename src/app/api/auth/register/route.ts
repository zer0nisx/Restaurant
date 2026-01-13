import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, telefono, correo, contraseña, ciudad_id, municipio_id, calle, rol = 'Cliente' } = body;

    // Validaciones
    if (!nombre || !telefono || !correo || !contraseña) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verificar si el usuario ya existe
    const existingUser = db.prepare(`
      SELECT id FROM usuarios
      WHERE correo = ? OR telefono = ? OR nombre = ?
    `).get(correo, telefono, nombre);

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe con ese correo, teléfono o nombre de usuario' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(contraseña);

    // Crear usuario
    const result = db.prepare(`
      INSERT INTO usuarios (rol, nombre, telefono, correo, contraseña, ciudad_id, municipio_id, calle)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(rol, nombre, telefono, correo, hashedPassword, ciudad_id || null, municipio_id || null, calle || null);

    const userId = Number(result.lastInsertRowid);

    // Obtener usuario completo
    const user = db.prepare(`
      SELECT id, nombre, correo, telefono, rol, ciudad_id, municipio_id, calle
      FROM usuarios WHERE id = ?
    `).get(userId) as any;

    // Crear sesión
    await setSession({
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    });

    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono,
        rol: user.rol,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
