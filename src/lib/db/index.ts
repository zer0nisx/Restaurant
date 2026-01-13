import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'restaurant.db');
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDb();

  try {
    const schemaPath = join(process.cwd(), 'src/lib/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    database.exec(schema);
    console.log('✅ Database schema initialized successfully');

    seedInitialData();
    console.log('✅ Initial data seeded successfully');

    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
}

function seedInitialData() {
  const database = getDb();

  // Check if data already exists
  const ciudadCount = database.prepare('SELECT COUNT(*) as count FROM ciudad').get() as { count: number };
  if (ciudadCount.count > 0) {
    console.log('ℹ️  Database already contains data, skipping seed');
    return;
  }

  // Seed Ciudades
  const insertCiudad = database.prepare(`
    INSERT INTO ciudad (estado, codigoPostal, nombre) VALUES (?, ?, ?)
  `);

  const ciudades = [
    ['Zulia', '4001', 'Maracaibo'],
    ['Miranda', '1010', 'Caracas'],
    ['Carabobo', '2001', 'Valencia'],
    ['Aragua', '2101', 'Maracay'],
  ];

  const ciudadIds: Record<string, number> = {};
  for (const ciudad of ciudades) {
    const result = insertCiudad.run(...ciudad);
    ciudadIds[ciudad[2]] = Number(result.lastInsertRowid);
  }

  // Seed Municipios
  const insertMunicipio = database.prepare(`
    INSERT INTO municipio (nombre, ciudad_id) VALUES (?, ?)
  `);

  const municipios = [
    ['Maracaibo', ciudadIds['Maracaibo']],
    ['San Francisco', ciudadIds['Maracaibo']],
    ['Libertador', ciudadIds['Caracas']],
    ['Chacao', ciudadIds['Caracas']],
    ['Valencia', ciudadIds['Valencia']],
    ['Girardot', ciudadIds['Maracay']],
  ];

  for (const municipio of municipios) {
    insertMunicipio.run(...municipio);
  }

  // Seed Preguntas de Seguridad
  const insertPregunta = database.prepare(`
    INSERT INTO preguntas_seguridad (pregunta) VALUES (?)
  `);

  const preguntas = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es tu comida favorita?',
    '¿Nombre de tu mejor amigo de la infancia?',
    '¿Cuál es el nombre de soltera de tu madre?',
  ];

  for (const pregunta of preguntas) {
    insertPregunta.run(pregunta);
  }

  // Seed Categorías de Productos
  const insertCategoriaProducto = database.prepare(`
    INSERT INTO categoria_producto (nombre, descripcion) VALUES (?, ?)
  `);

  const categoriasProducto = [
    ['Bebidas', 'Bebidas y refrescos'],
    ['Ingredientes', 'Ingredientes para preparación'],
    ['Empaques', 'Material de empaque y servicio'],
    ['Postres', 'Postres y dulces'],
  ];

  for (const categoria of categoriasProducto) {
    insertCategoriaProducto.run(...categoria);
  }

  // Seed Categorías de Menú
  const insertCategoria = database.prepare(`
    INSERT INTO categoria (nombre, descripcion, orden) VALUES (?, ?, ?)
  `);

  const categorias = [
    ['Pizzas', 'Deliciosas pizzas artesanales', 1],
    ['Hamburguesas', 'Hamburguesas gourmet', 2],
    ['Pastas', 'Pastas frescas italianas', 3],
    ['Ensaladas', 'Ensaladas frescas y saludables', 4],
    ['Bebidas', 'Bebidas frías y calientes', 5],
    ['Postres', 'Dulces tentaciones', 6],
  ];

  const categoriaIds: Record<string, number> = {};
  for (const categoria of categorias) {
    const result = insertCategoria.run(...categoria);
    categoriaIds[categoria[0]] = Number(result.lastInsertRowid);
  }

  // Seed Subcategorías
  const insertSubcategoria = database.prepare(`
    INSERT INTO subcategoria (nombre, categoria_id, orden) VALUES (?, ?, ?)
  `);

  const subcategorias = [
    ['Pizzas Clásicas', categoriaIds['Pizzas'], 1],
    ['Pizzas Especiales', categoriaIds['Pizzas'], 2],
    ['Pizzas Vegetarianas', categoriaIds['Pizzas'], 3],
    ['Hamburguesas Clásicas', categoriaIds['Hamburguesas'], 1],
    ['Hamburguesas Premium', categoriaIds['Hamburguesas'], 2],
  ];

  for (const subcategoria of subcategorias) {
    insertSubcategoria.run(...subcategoria);
  }

  // Seed Configuración
  const insertConfig = database.prepare(`
    INSERT INTO configuracion (clave, valor, descripcion, tipo) VALUES (?, ?, ?, ?)
  `);

  const configs = [
    ['costo_delivery', '5.00', 'Costo base de delivery', 'Number'],
    ['tiempo_preparacion_min', '30', 'Tiempo mínimo de preparación en minutos', 'Number'],
    ['horario_apertura', '11:00', 'Hora de apertura', 'String'],
    ['horario_cierre', '23:00', 'Hora de cierre', 'String'],
    ['moneda', 'USD', 'Moneda principal del sistema', 'String'],
    ['iva', '16', 'Porcentaje de IVA', 'Number'],
  ];

  for (const config of configs) {
    insertConfig.run(...config);
  }

  // Seed Vehículos
  const insertVehiculo = database.prepare(`
    INSERT INTO vehiculos (nombre, descripcion, matricula, estado) VALUES (?, ?, ?, ?)
  `);

  const vehiculos = [
    ['Moto Honda 1', 'Honda Wave 110cc', 'ABC-123', 'Disponible'],
    ['Moto Yamaha 1', 'Yamaha FZ 150cc', 'DEF-456', 'Disponible'],
    ['Bicicleta 1', 'Bicicleta eléctrica', 'GHI-789', 'Disponible'],
  ];

  for (const vehiculo of vehiculos) {
    insertVehiculo.run(...vehiculo);
  }

  // Seed Mesas
  const insertMesa = database.prepare(`
    INSERT INTO mesas (numero, capacidad, ubicacion, descripcion) VALUES (?, ?, ?, ?)
  `);

  const mesas = [
    ['Mesa 1', 2, 'Planta baja, ventana', 'Mesa romántica con vista a la calle'],
    ['Mesa 2', 4, 'Planta baja, centro', 'Mesa familiar central'],
    ['Mesa 3', 4, 'Planta baja, esquina', 'Mesa tranquila en esquina'],
    ['Mesa 4', 6, 'Planta alta, terraza', 'Mesa grande en terraza'],
    ['Mesa 5', 8, 'Salón privado', 'Mesa para grupos grandes'],
  ];

  for (const mesa of mesas) {
    insertMesa.run(...mesa);
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Utility functions
export function generateNumero(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function softDelete(table: string, id: number) {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  return stmt.run(id);
}

export function restore(table: string, id: number) {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE ${table} SET deleted_at = NULL WHERE id = ?
  `);
  return stmt.run(id);
}
