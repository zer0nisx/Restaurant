import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const SALT_ROUNDS = 10;

export interface UserPayload {
  id: number;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Repartidor' | 'Cliente';
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Security question hashing
export async function hashSecurityAnswer(answer: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  return bcrypt.hash(normalized, SALT_ROUNDS);
}

export async function verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
  const normalized = answer.toLowerCase().trim();
  return bcrypt.compare(normalized, hash);
}

// JWT Token generation
export async function generateToken(payload: UserPayload): Promise<string> {
  const token = await new SignJWT({ user: payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secret);

  return token;
}

// JWT Token verification
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.user as UserPayload) || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Session management with cookies
export async function setSession(user: UserPayload) {
  const token = await generateToken(user);
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  return verifyToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Middleware helper
export async function requireAuth(allowedRoles?: UserPayload['rol'][]): Promise<UserPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error('No autorizado');
  }

  if (allowedRoles && !allowedRoles.includes(session.rol)) {
    throw new Error('No tienes permisos para realizar esta acción');
  }

  return session;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.rol === 'Administrador';
}

// Check if user is repartidor
export async function isRepartidor(): Promise<boolean> {
  const session = await getSession();
  return session?.rol === 'Repartidor';
}

// Check if user is cliente
export async function isCliente(): Promise<boolean> {
  const session = await getSession();
  return session?.rol === 'Cliente';
}
