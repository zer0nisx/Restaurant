import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'restaurant.db');
const db = new Database(dbPath);

async function seed() {
  console.log('🌱 Iniciando seed de datos...\n');

  try {
    // 1. Crear usuario administrador
    console.log('👤 Creando usuarios...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientePassword = await bcrypt.hash('cliente123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, rol, nombre, telefono, correo, contraseña)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(1, 'Administrador', 'admin', '+58-412-1234567', 'admin@restaurant.com', adminPassword);

  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, rol, nombre, telefono, correo, contraseña)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(2, 'Cliente', 'cliente', '+58-412-7654321', 'cliente@email.com', clientePassword);

  console.log('✅ Usuarios creados\n');

  // 2. Crear categorías del menú
  console.log('🍽️ Creando categorías del menú...');
  const categorias = [
    { nombre: 'Pizzas', descripcion: 'Pizzas artesanales con masa tradicional', orden: 1 },
    { nombre: 'Hamburguesas', descripcion: 'Hamburguesas gourmet con ingredientes frescos', orden: 2 },
    { nombre: 'Pastas', descripcion: 'Pastas frescas al estilo italiano', orden: 3 },
    { nombre: 'Ensaladas', descripcion: 'Ensaladas frescas y saludables', orden: 4 },
    { nombre: 'Postres', descripcion: 'Deliciosos postres caseros', orden: 5 },
    { nombre: 'Bebidas', descripcion: 'Bebidas frías y calientes', orden: 6 },
  ];

  for (const cat of categorias) {
    db.prepare(`
      INSERT OR IGNORE INTO categoria (nombre, descripcion, orden)
      VALUES (?, ?, ?)
    `).run(cat.nombre, cat.descripcion, cat.orden);
  }
  console.log('✅ Categorías creadas\n');

  // 3. Crear subcategorías
  console.log('📂 Creando subcategorías...');
  const subcategorias = [
    { nombre: 'Pizzas Clásicas', categoria: 'Pizzas', orden: 1 },
    { nombre: 'Pizzas Especiales', categoria: 'Pizzas', orden: 2 },
    { nombre: 'Pizzas Vegetarianas', categoria: 'Pizzas', orden: 3 },
    { nombre: 'Hamburguesas Clásicas', categoria: 'Hamburguesas', orden: 1 },
    { nombre: 'Hamburguesas Premium', categoria: 'Hamburguesas', orden: 2 },
    { nombre: 'Pastas con Salsa Roja', categoria: 'Pastas', orden: 1 },
    { nombre: 'Pastas con Salsa Blanca', categoria: 'Pastas', orden: 2 },
  ];

  for (const sub of subcategorias) {
    const categoriaId = db.prepare('SELECT id FROM categoria WHERE nombre = ?').get(sub.categoria) as any;
    if (categoriaId) {
      db.prepare(`
        INSERT OR IGNORE INTO subcategoria (nombre, categoria_id, orden)
        VALUES (?, ?, ?)
      `).run(sub.nombre, categoriaId.id, sub.orden);
    }
  }
  console.log('✅ Subcategorías creadas\n');

  // 4. Crear ítems del menú
  console.log('🍕 Creando ítems del menú...');

  const menuItems = [
    // Pizzas Clásicas
    {
      nombre: 'Pizza Margarita',
      descripcion: 'Salsa de tomate, mozzarella, albahaca fresca y aceite de oliva',
      precio: 12.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Clásicas',
      destacado: 1,
      tiempo_preparacion: 25
    },
    {
      nombre: 'Pizza Pepperoni',
      descripcion: 'Salsa de tomate, mozzarella y abundante pepperoni',
      precio: 14.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Clásicas',
      destacado: 1,
      tiempo_preparacion: 25
    },
    {
      nombre: 'Pizza Hawaiana',
      descripcion: 'Salsa de tomate, mozzarella, jamón y piña',
      precio: 13.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Clásicas',
      destacado: 0,
      tiempo_preparacion: 25
    },
    // Pizzas Especiales
    {
      nombre: 'Pizza Cuatro Quesos',
      descripcion: 'Mozzarella, parmesano, gorgonzola y queso de cabra',
      precio: 16.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Especiales',
      destacado: 1,
      tiempo_preparacion: 30
    },
    {
      nombre: 'Pizza Barbecue',
      descripcion: 'Salsa BBQ, pollo, cebolla, bacon y mozzarella',
      precio: 17.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Especiales',
      destacado: 0,
      tiempo_preparacion: 30
    },
    // Pizzas Vegetarianas
    {
      nombre: 'Pizza Vegetariana',
      descripcion: 'Pimientos, champiñones, cebolla, aceitunas, tomate y mozzarella',
      precio: 14.99,
      categoria: 'Pizzas',
      subcategoria: 'Pizzas Vegetarianas',
      destacado: 0,
      tiempo_preparacion: 25
    },
    // Hamburguesas Clásicas
    {
      nombre: 'Hamburguesa Clásica',
      descripcion: 'Carne de res, lechuga, tomate, cebolla, pepinillos y salsa especial',
      precio: 9.99,
      categoria: 'Hamburguesas',
      subcategoria: 'Hamburguesas Clásicas',
      destacado: 1,
      tiempo_preparacion: 20
    },
    {
      nombre: 'Hamburguesa con Queso',
      descripcion: 'Carne de res, queso cheddar, lechuga, tomate y salsa especial',
      precio: 10.99,
      categoria: 'Hamburguesas',
      subcategoria: 'Hamburguesas Clásicas',
      destacado: 0,
      tiempo_preparacion: 20
    },
    // Hamburguesas Premium
    {
      nombre: 'Hamburguesa BBQ Bacon',
      descripcion: 'Carne de res, bacon, cebolla caramelizada, queso cheddar y salsa BBQ',
      precio: 13.99,
      categoria: 'Hamburguesas',
      subcategoria: 'Hamburguesas Premium',
      destacado: 1,
      tiempo_preparacion: 25
    },
    {
      nombre: 'Hamburguesa Doble',
      descripcion: 'Doble carne de res, doble queso, lechuga, tomate y salsa especial',
      precio: 15.99,
      categoria: 'Hamburguesas',
      subcategoria: 'Hamburguesas Premium',
      destacado: 0,
      tiempo_preparacion: 25
    },
    // Pastas
    {
      nombre: 'Spaghetti Bolognesa',
      descripcion: 'Pasta con salsa de carne molida y tomate, queso parmesano',
      precio: 11.99,
      categoria: 'Pastas',
      subcategoria: 'Pastas con Salsa Roja',
      destacado: 1,
      tiempo_preparacion: 20
    },
    {
      nombre: 'Fettuccine Alfredo',
      descripcion: 'Pasta con salsa cremosa de queso parmesano y mantequilla',
      precio: 12.99,
      categoria: 'Pastas',
      subcategoria: 'Pastas con Salsa Blanca',
      destacado: 0,
      tiempo_preparacion: 20
    },
    {
      nombre: 'Lasagna',
      descripcion: 'Capas de pasta, carne molida, salsa bechamel y queso',
      precio: 13.99,
      categoria: 'Pastas',
      subcategoria: 'Pastas con Salsa Roja',
      destacado: 1,
      tiempo_preparacion: 35
    },
    // Ensaladas
    {
      nombre: 'Ensalada César',
      descripcion: 'Lechuga romana, pollo a la parrilla, crutones, queso parmesano y aderezo César',
      precio: 8.99,
      categoria: 'Ensaladas',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 15
    },
    {
      nombre: 'Ensalada Griega',
      descripcion: 'Tomate, pepino, cebolla, aceitunas, queso feta y aceite de oliva',
      precio: 7.99,
      categoria: 'Ensaladas',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 15
    },
    // Postres
    {
      nombre: 'Tiramisú',
      descripcion: 'Postre italiano con café, mascarpone y cacao',
      precio: 6.99,
      categoria: 'Postres',
      subcategoria: null,
      destacado: 1,
      tiempo_preparacion: 10
    },
    {
      nombre: 'Cheesecake',
      descripcion: 'Pastel de queso con base de galleta y coulis de frutos rojos',
      precio: 6.99,
      categoria: 'Postres',
      subcategoria: null,
      destacado: 1,
      tiempo_preparacion: 10
    },
    {
      nombre: 'Brownie con Helado',
      descripcion: 'Brownie de chocolate caliente con helado de vainilla',
      precio: 5.99,
      categoria: 'Postres',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 10
    },
    // Bebidas
    {
      nombre: 'Coca Cola',
      descripcion: 'Refresco de cola 500ml',
      precio: 2.50,
      categoria: 'Bebidas',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 5
    },
    {
      nombre: 'Agua Mineral',
      descripcion: 'Agua mineral natural 500ml',
      precio: 1.50,
      categoria: 'Bebidas',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 5
    },
    {
      nombre: 'Jugo Natural',
      descripcion: 'Jugo natural de naranja o limón',
      precio: 3.50,
      categoria: 'Bebidas',
      subcategoria: null,
      destacado: 0,
      tiempo_preparacion: 10
    },
  ];

  for (const item of menuItems) {
    const categoriaId = db.prepare('SELECT id FROM categoria WHERE nombre = ?').get(item.categoria) as any;
    let subcategoriaId = null;
    if (item.subcategoria) {
      const subcat = db.prepare('SELECT id FROM subcategoria WHERE nombre = ?').get(item.subcategoria) as any;
      subcategoriaId = subcat?.id;
    }

    db.prepare(`
      INSERT OR IGNORE INTO menu (nombre, descripcion, precio, categoria_id, subcategoria_id, destacado, tiempo_preparacion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.nombre,
      item.descripcion,
      item.precio,
      categoriaId.id,
      subcategoriaId,
      item.destacado,
      item.tiempo_preparacion
    );
  }
  console.log('✅ Ítems del menú creados\n');

  // 5. Crear ubicaciones (ciudades y municipios)
  console.log('📍 Creando ubicaciones...');

  db.prepare(`
    INSERT OR IGNORE INTO ciudad (id, estado, codigoPostal, nombre)
    VALUES (?, ?, ?, ?)
  `).run(1, 'Zulia', '4001', 'Maracaibo');

  db.prepare(`
    INSERT OR IGNORE INTO municipio (id, nombre, ciudad_id)
    VALUES (?, ?, ?)
  `).run(1, 'Maracaibo', 1);

  db.prepare(`
    INSERT OR IGNORE INTO municipio (id, nombre, ciudad_id)
    VALUES (?, ?, ?)
  `).run(2, 'San Francisco', 1);

  console.log('✅ Ubicaciones creadas\n');

  // 6. Crear vehículos
  console.log('🚗 Creando vehículos...');

  const vehiculos = [
    { nombre: 'Moto Honda 1', descripcion: 'Moto Honda Wave 110', matricula: 'MOT-001' },
    { nombre: 'Moto Yamaha 1', descripcion: 'Yamaha FZ 150', matricula: 'MOT-002' },
    { nombre: 'Carro Toyota 1', descripcion: 'Toyota Corolla', matricula: 'CAR-001' },
  ];

  for (const vehiculo of vehiculos) {
    db.prepare(`
      INSERT OR IGNORE INTO vehiculos (nombre, descripcion, matricula, estado)
      VALUES (?, ?, ?, ?)
    `).run(vehiculo.nombre, vehiculo.descripcion, vehiculo.matricula, 'Disponible');
  }
  console.log('✅ Vehículos creados\n');

  // 7. Crear personal de entrega
  console.log('🏍️ Creando personal de entrega...');

  const repartidorPassword = await bcrypt.hash('repartidor123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, rol, nombre, telefono, correo, contraseña)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(3, 'Repartidor', 'repartidor1', '+58-424-1111111', 'repartidor1@restaurant.com', repartidorPassword);

  const vehiculo1 = db.prepare('SELECT id FROM vehiculos WHERE matricula = ?').get('MOT-001') as any;

  db.prepare(`
    INSERT OR IGNORE INTO personal_entrega (ci, nombre, apellido, email, telefono, vehiculo_id, disponibilidad, laborando)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('V-12345678', 'Juan', 'Pérez', 'repartidor1@restaurant.com', '+58-424-1111111', vehiculo1.id, 1, 1);

  console.log('✅ Personal de entrega creado\n');

  // 8. Crear mesas
  console.log('🪑 Creando mesas...');

  const mesas = [
    { numero: 'Mesa 1', capacidad: 2, ubicacion: 'Planta baja - Ventana', descripcion: 'Mesa romántica con vista' },
    { numero: 'Mesa 2', capacidad: 4, ubicacion: 'Planta baja - Centro', descripcion: 'Mesa familiar' },
    { numero: 'Mesa 3', capacidad: 4, ubicacion: 'Planta baja - Centro', descripcion: 'Mesa familiar' },
    { numero: 'Mesa 4', capacidad: 6, ubicacion: 'Planta baja - Esquina', descripcion: 'Mesa para grupos' },
    { numero: 'Mesa 5', capacidad: 2, ubicacion: 'Terraza', descripcion: 'Mesa al aire libre' },
    { numero: 'Mesa 6', capacidad: 8, ubicacion: 'Salón privado', descripcion: 'Mesa para eventos' },
  ];

  for (const mesa of mesas) {
    db.prepare(`
      INSERT OR IGNORE INTO mesas (numero, capacidad, ubicacion, descripcion)
      VALUES (?, ?, ?, ?)
    `).run(mesa.numero, mesa.capacidad, mesa.ubicacion, mesa.descripcion);
  }
  console.log('✅ Mesas creadas\n');

  // 9. Crear configuración inicial
  console.log('⚙️ Creando configuración...');

  const configs = [
    { clave: 'costo_delivery', valor: '5.00', descripcion: 'Costo base de delivery', tipo: 'Number' },
    { clave: 'tiempo_preparacion_min', valor: '30', descripcion: 'Tiempo mínimo de preparación en minutos', tipo: 'Number' },
    { clave: 'horario_apertura', valor: '11:00', descripcion: 'Hora de apertura', tipo: 'String' },
    { clave: 'horario_cierre', valor: '23:00', descripcion: 'Hora de cierre', tipo: 'String' },
    { clave: 'nombre_restaurante', valor: 'Restaurant Manager', descripcion: 'Nombre del restaurante', tipo: 'String' },
    { clave: 'telefono_restaurante', valor: '+58-261-7654321', descripcion: 'Teléfono del restaurante', tipo: 'String' },
  ];

  for (const config of configs) {
    db.prepare(`
      INSERT OR REPLACE INTO configuracion (clave, valor, descripcion, tipo)
      VALUES (?, ?, ?, ?)
    `).run(config.clave, config.valor, config.descripcion, config.tipo);
  }
  console.log('✅ Configuración creada\n');

    console.log('🎉 Seed completado exitosamente!\n');
    console.log('📝 Credenciales de acceso:');
    console.log('   Admin: admin@restaurant.com / admin123');
    console.log('   Cliente: cliente@email.com / cliente123');
    console.log('   Repartidor: repartidor1@restaurant.com / repartidor123\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    db.close();
  }
}

// Ejecutar seed
seed().catch(console.error);
