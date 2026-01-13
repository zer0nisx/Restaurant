import { getDb } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function seedDemoData() {
  const db = getDb();

  console.log('🌱 Seeding demo data...');

  // Check if demo users already exist
  const existingUser = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get('admin@restaurant.com');
  if (existingUser) {
    console.log('ℹ️  Demo users already exist, skipping...');
    return;
  }

  try {
    // Create demo users
    const adminPassword = await hashPassword('admin123');
    const repartidorPassword = await hashPassword('repartidor123');
    const clientePassword = await hashPassword('cliente123');

    // Admin user
    db.prepare(`
      INSERT INTO usuarios (rol, nombre, telefono, correo, contraseña, activo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Administrador', 'admin', '0412-1111111', 'admin@restaurant.com', adminPassword, 1);

    console.log('✅ Admin user created');

    // Repartidor user
    const repartidorResult = db.prepare(`
      INSERT INTO usuarios (rol, nombre, telefono, correo, contraseña, activo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Repartidor', 'repartidor', '0412-2222222', 'repartidor@restaurant.com', repartidorPassword, 1);

    const repartidorUserId = Number(repartidorResult.lastInsertRowid);

    // Create personal_entrega for repartidor
    const vehiculo = db.prepare('SELECT id FROM vehiculos LIMIT 1').get() as any;
    if (vehiculo) {
      db.prepare(`
        INSERT INTO personal_entrega (ci, nombre, apellido, email, telefono, vehiculo_id, disponibilidad, laborando)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('V-12345678', 'Juan', 'Pérez', 'repartidor@restaurant.com', '0412-2222222', vehiculo.id, 1, 1);
    }

    console.log('✅ Repartidor user created');

    // Cliente user
    const ciudadId = db.prepare('SELECT id FROM ciudad LIMIT 1').get() as any;
    db.prepare(`
      INSERT INTO usuarios (rol, nombre, telefono, correo, contraseña, ciudad_id, calle, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Cliente', 'cliente', '0412-3333333', 'cliente@restaurant.com', clientePassword, ciudadId?.id || null, 'Calle Principal #123', 1);

    console.log('✅ Cliente user created');

    // Seed menu items
    const categorias = db.prepare('SELECT id, nombre FROM categoria').all() as any[];

    if (categorias.length > 0) {
      const menuItems = [
        {
          nombre: 'Pizza Margarita',
          descripcion: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva',
          precio: 12.50,
          categoria: 'Pizzas',
          destacado: 1,
          tiempo_preparacion: 25,
        },
        {
          nombre: 'Pizza Pepperoni',
          descripcion: 'Salsa de tomate, mozzarella y abundante pepperoni',
          precio: 14.00,
          categoria: 'Pizzas',
          destacado: 1,
          tiempo_preparacion: 25,
        },
        {
          nombre: 'Hamburguesa Clásica',
          descripcion: 'Carne de res 180g, lechuga, tomate, cebolla, queso y salsa especial',
          precio: 9.50,
          categoria: 'Hamburguesas',
          destacado: 1,
          tiempo_preparacion: 20,
        },
        {
          nombre: 'Hamburguesa BBQ',
          descripcion: 'Carne de res 180g, queso cheddar, bacon, cebolla caramelizada y salsa BBQ',
          precio: 11.00,
          categoria: 'Hamburguesas',
          destacado: 1,
          tiempo_preparacion: 20,
        },
        {
          nombre: 'Pasta Carbonara',
          descripcion: 'Espagueti con salsa carbonara cremosa, bacon y parmesano',
          precio: 10.00,
          categoria: 'Pastas',
          destacado: 0,
          tiempo_preparacion: 15,
        },
        {
          nombre: 'Ensalada César',
          descripcion: 'Lechuga romana, crutones, parmesano, pollo a la parrilla y aderezo césar',
          precio: 8.00,
          categoria: 'Ensaladas',
          destacado: 0,
          tiempo_preparacion: 10,
        },
        {
          nombre: 'Coca-Cola',
          descripcion: 'Refresco de cola 500ml',
          precio: 2.50,
          categoria: 'Bebidas',
          destacado: 0,
          tiempo_preparacion: 2,
        },
        {
          nombre: 'Limonada Natural',
          descripcion: 'Limonada fresca con menta',
          precio: 3.00,
          categoria: 'Bebidas',
          destacado: 0,
          tiempo_preparacion: 5,
        },
        {
          nombre: 'Tiramisú',
          descripcion: 'Postre italiano clásico con café y mascarpone',
          precio: 5.50,
          categoria: 'Postres',
          destacado: 1,
          tiempo_preparacion: 5,
        },
        {
          nombre: 'Brownie con Helado',
          descripcion: 'Brownie de chocolate caliente con helado de vainilla',
          precio: 6.00,
          categoria: 'Postres',
          destacado: 1,
          tiempo_preparacion: 8,
        },
      ];

      const insertMenu = db.prepare(`
        INSERT INTO menu (nombre, descripcion, precio, categoria_id, destacado, tiempo_preparacion)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of menuItems) {
        const categoria = categorias.find(c => c.nombre === item.categoria);
        if (categoria) {
          insertMenu.run(
            item.nombre,
            item.descripcion,
            item.precio,
            categoria.id,
            item.destacado,
            item.tiempo_preparacion
          );
        }
      }

      console.log('✅ Menu items created');
    }

    console.log('✨ Demo data seeded successfully!');
    console.log('\n📝 Demo Accounts:');
    console.log('   Admin: admin@restaurant.com / admin123');
    console.log('   Repartidor: repartidor@restaurant.com / repartidor123');
    console.log('   Cliente: cliente@restaurant.com / cliente123\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDemoData;
