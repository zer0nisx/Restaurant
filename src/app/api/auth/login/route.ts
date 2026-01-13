import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correo, contraseña } = body;

    if (!correo || !contraseña) {
      return NextResponse.json(
        { error: 'Correo y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Buscar usuario
    const user = db.prepare(`
      SELECT id, nombre, correo, contraseña, rol, activo
      FROM usuarios
      WHERE correo = ? AND deleted_at IS NULL
    `).get(correo) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!user.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacte al administrador' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isValid = await verifyPassword(contraseña, user.contraseña);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Actualizar último acceso
    db.prepare(`
      UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?
    `).run(user.id);

    // Crear sesión
    await setSession({
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    });

    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
