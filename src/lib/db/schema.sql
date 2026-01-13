-- ============================================================================
-- SISTEMA DE GESTIÓN DE RESTAURANTE CON DELIVERY Y RESERVAS
-- Base de Datos: SQLite
-- Versión: 2.0 (Mejorada con soft delete, auditoría y optimizaciones)
-- ============================================================================

-- ============================================================================
-- MÓDULO 1: SISTEMA DE UBICACIONES GEOGRÁFICAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ciudad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estado TEXT NOT NULL,
    codigoPostal TEXT NOT NULL,
    nombre TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ciudad_nombre ON ciudad(nombre);
CREATE INDEX IF NOT EXISTS idx_ciudad_activo ON ciudad(activo);

CREATE TABLE IF NOT EXISTS municipio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ciudad_id INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ciudad_id) REFERENCES ciudad(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_municipio_ciudad ON municipio(ciudad_id);
CREATE INDEX IF NOT EXISTS idx_municipio_activo ON municipio(activo);

CREATE TABLE IF NOT EXISTS calle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    municipio_id INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (municipio_id) REFERENCES municipio(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calle_municipio ON calle(municipio_id);
CREATE INDEX IF NOT EXISTS idx_calle_activo ON calle(activo);

-- ============================================================================
-- MÓDULO 2: SISTEMA DE PRODUCTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS categoria_producto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categoria_producto_nombre ON categoria_producto(nombre);
CREATE INDEX IF NOT EXISTS idx_categoria_producto_activo ON categoria_producto(activo);

CREATE TABLE IF NOT EXISTS producto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER NOT NULL,
    precio_venta REAL NOT NULL CHECK(precio_venta >= 0),
    costo REAL NOT NULL CHECK(costo >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    activo INTEGER NOT NULL DEFAULT 1,
    ruta_imagen TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (categoria_id) REFERENCES categoria_producto(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON producto(activo);
CREATE INDEX IF NOT EXISTS idx_producto_deleted ON producto(deleted_at);
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON producto(nombre);

-- ============================================================================
-- MÓDULO 3: SISTEMA DE MENÚ DEL RESTAURANTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categoria_nombre ON categoria(nombre);
CREATE INDEX IF NOT EXISTS idx_categoria_activo ON categoria(activo);
CREATE INDEX IF NOT EXISTS idx_categoria_orden ON categoria(orden);

CREATE TABLE IF NOT EXISTS subcategoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    orden INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE CASCADE,
    UNIQUE(nombre, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_subcategoria_categoria ON subcategoria(categoria_id);
CREATE INDEX IF NOT EXISTS idx_subcategoria_activo ON subcategoria(activo);

CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL CHECK(precio > 0),
    categoria_id INTEGER NOT NULL,
    subcategoria_id INTEGER,
    activo INTEGER DEFAULT 1,
    destacado INTEGER DEFAULT 0,
    ruta_imagen TEXT,
    tiempo_preparacion INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id),
    FOREIGN KEY (subcategoria_id) REFERENCES subcategoria(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_categoria ON menu(categoria_id);
CREATE INDEX IF NOT EXISTS idx_menu_subcategoria ON menu(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_menu_activo ON menu(activo);
CREATE INDEX IF NOT EXISTS idx_menu_destacado ON menu(destacado);
CREATE INDEX IF NOT EXISTS idx_menu_deleted ON menu(deleted_at);

-- ============================================================================
-- MÓDULO 4: SISTEMA DE DELIVERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    matricula TEXT UNIQUE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Disponible' CHECK(estado IN ('Disponible', 'En mantenimiento', 'Inactivo')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON vehiculos(estado);
CREATE INDEX IF NOT EXISTS idx_vehiculos_matricula ON vehiculos(matricula);

CREATE TABLE IF NOT EXISTS personal_entrega (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ci TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT UNIQUE,
    fecha_nacimiento DATE,
    vehiculo_id INTEGER,
    disponibilidad INTEGER DEFAULT 1,
    laborando INTEGER DEFAULT 1,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_personal_disponibilidad ON personal_entrega(disponibilidad);
CREATE INDEX IF NOT EXISTS idx_personal_laborando ON personal_entrega(laborando);
CREATE INDEX IF NOT EXISTS idx_personal_email ON personal_entrega(email);

-- ============================================================================
-- MÓDULO 5: SISTEMA DE USUARIOS Y AUTENTICACIÓN
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rol TEXT NOT NULL DEFAULT 'Cliente' CHECK(rol IN ('Administrador', 'Repartidor', 'Cliente')),
    nombre TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL UNIQUE,
    correo TEXT NOT NULL UNIQUE,
    contraseña TEXT NOT NULL,
    ciudad_id INTEGER,
    municipio_id INTEGER,
    calle TEXT,
    activo INTEGER DEFAULT 1,
    verificado INTEGER DEFAULT 0,
    ultimo_acceso DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (ciudad_id) REFERENCES ciudad(id) ON DELETE SET NULL,
    FOREIGN KEY (municipio_id) REFERENCES municipio(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuario_ciudad ON usuarios(ciudad_id);
CREATE INDEX IF NOT EXISTS idx_usuario_municipio ON usuarios(municipio_id);
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_deleted ON usuarios(deleted_at);

CREATE TABLE IF NOT EXISTS preguntas_seguridad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta TEXT NOT NULL UNIQUE,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS respuestas_usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    pregunta_id INTEGER NOT NULL,
    respuesta TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_seguridad(id),
    UNIQUE(usuario_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_respuestas_usuario ON respuestas_usuario(usuario_id);

-- ============================================================================
-- MÓDULO 6: SISTEMA DE PEDIDOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_pedido TEXT UNIQUE NOT NULL,
    id_usuario INTEGER,
    tipoEntrega TEXT NOT NULL CHECK(tipoEntrega IN ('Delivery', 'Recogida')),
    ciudad_id INTEGER,
    municipio_id INTEGER,
    calle TEXT NOT NULL,
    residencia TEXT NOT NULL,
    nombreCliente TEXT NOT NULL,
    telefonoCliente TEXT NOT NULL,
    descripcion TEXT,
    metodoPago TEXT NOT NULL CHECK(metodoPago IN ('Efectivo', 'Divisa', 'Tarjeta', 'Pago Movil')),
    total REAL NOT NULL,
    estadoPedido TEXT NOT NULL DEFAULT 'Ordenado' CHECK(estadoPedido IN ('Ordenado', 'En preparación', 'Listo para entrega', 'En camino', 'Entregado', 'Cancelado')),
    estadoEntrega TEXT DEFAULT 'Pendiente' CHECK(estadoEntrega IN ('Pendiente', 'En proceso', 'Completada', 'Fallida', 'Cancelada')),
    personal_entrega_id INTEGER,
    tiempo_estimado INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaHoraEntrega DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (ciudad_id) REFERENCES ciudad(id) ON DELETE SET NULL,
    FOREIGN KEY (municipio_id) REFERENCES municipio(id) ON DELETE SET NULL,
    FOREIGN KEY (personal_entrega_id) REFERENCES personal_entrega(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pedido_numero ON pedido(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estadoPedido);
CREATE INDEX IF NOT EXISTS idx_pedido_fecha ON pedido(created_at);
CREATE INDEX IF NOT EXISTS idx_pedido_repartidor ON pedido(personal_entrega_id);
CREATE INDEX IF NOT EXISTS idx_pedido_deleted ON pedido(deleted_at);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER,
    menu_id INTEGER,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE SET NULL,
    CHECK (producto_id IS NOT NULL OR menu_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_detalle_pedido ON detalle_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_menu ON detalle_pedido(menu_id);

-- ============================================================================
-- MÓDULO 7: SISTEMA DE FACTURACIÓN
-- ============================================================================

CREATE TABLE IF NOT EXISTS factura (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_factura TEXT UNIQUE NOT NULL,
    pedido_id INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Sin pagar' CHECK(estado IN ('Sin pagar', 'Cancelado', 'Pagado')),
    total REAL NOT NULL,
    metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Otro')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id)
);

CREATE INDEX IF NOT EXISTS idx_factura_numero ON factura(numero_factura);
CREATE INDEX IF NOT EXISTS idx_factura_pedido ON factura(pedido_id);
CREATE INDEX IF NOT EXISTS idx_factura_estado ON factura(estado);
CREATE INDEX IF NOT EXISTS idx_factura_fecha ON factura(created_at);

-- ============================================================================
-- MÓDULO 8: SISTEMA DE RESERVAS DE MESAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    capacidad INTEGER NOT NULL CHECK(capacidad > 0),
    ubicacion TEXT,
    descripcion TEXT,
    disponible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mesas_numero ON mesas(numero);
CREATE INDEX IF NOT EXISTS idx_mesas_disponible ON mesas(disponible);

CREATE TABLE IF NOT EXISTS reservas_mesas (
    slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    mesa_id INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible', 'reservado', 'ocupado', 'bloqueado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE RESTRICT,
    UNIQUE(fecha, hora_inicio, mesa_id)
);

CREATE INDEX IF NOT EXISTS idx_reservas_mesas_fecha ON reservas_mesas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_mesas_estado ON reservas_mesas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_mesas_mesa ON reservas_mesas(mesa_id);

CREATE TABLE IF NOT EXISTS reservas (
    reserva_id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_reserva TEXT UNIQUE NOT NULL,
    nombre_cliente TEXT NOT NULL,
    telefono_cliente TEXT NOT NULL,
    correo_cliente TEXT NOT NULL,
    costo_total REAL NOT NULL DEFAULT 0.00,
    estado_transaccion TEXT DEFAULT 'confirmada' CHECK(estado_transaccion IN ('confirmada', 'cancelada', 'completada', 'no_show')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservas_numero ON reservas(numero_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado_transaccion);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(created_at);

CREATE TABLE IF NOT EXISTS reserva_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(reserva_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES reservas_mesas(slot_id) ON DELETE RESTRICT,
    UNIQUE(reserva_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_reserva_slots_reserva ON reserva_slots(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reserva_slots_slot ON reserva_slots(slot_id);

-- ============================================================================
-- MÓDULO 9: SISTEMA DE AUDITORÍA Y NOTIFICACIONES (MEJORAS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    accion TEXT NOT NULL CHECK(accion IN ('INSERT', 'UPDATE', 'DELETE')),
    usuario_id INTEGER,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_tabla ON audit_log(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_registro ON audit_log(registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('Pedido', 'Promoción', 'Sistema', 'Reserva')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida INTEGER DEFAULT 0,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notif_fecha ON notificaciones(created_at);

CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL CHECK(tipo IN ('String', 'Number', 'Boolean', 'JSON')),
    actualizado_por INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS ciudad_updated_at
AFTER UPDATE ON ciudad
BEGIN
    UPDATE ciudad SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS municipio_updated_at
AFTER UPDATE ON municipio
BEGIN
    UPDATE municipio SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS calle_updated_at
AFTER UPDATE ON calle
BEGIN
    UPDATE calle SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS producto_updated_at
AFTER UPDATE ON producto
BEGIN
    UPDATE producto SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS menu_updated_at
AFTER UPDATE ON menu
BEGIN
    UPDATE menu SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS pedido_updated_at
AFTER UPDATE ON pedido
BEGIN
    UPDATE pedido SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS usuarios_updated_at
AFTER UPDATE ON usuarios
BEGIN
    UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

CREATE VIEW IF NOT EXISTS view_pedidos_activos AS
SELECT
    p.id,
    p.numero_pedido,
    p.nombreCliente,
    p.telefonoCliente,
    p.tipoEntrega,
    p.estadoPedido,
    p.estadoEntrega,
    p.total,
    p.created_at,
    u.nombre as usuario_nombre,
    pe.nombre as repartidor_nombre,
    pe.apellido as repartidor_apellido,
    COUNT(dp.id) as items_count
FROM pedido p
LEFT JOIN usuarios u ON p.id_usuario = u.id
LEFT JOIN personal_entrega pe ON p.personal_entrega_id = pe.id
LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
WHERE p.estadoPedido NOT IN ('Entregado', 'Cancelado')
    AND p.deleted_at IS NULL
GROUP BY p.id;

CREATE VIEW IF NOT EXISTS view_menu_disponible AS
SELECT
    m.id,
    m.nombre,
    m.descripcion,
    m.precio,
    m.ruta_imagen,
    m.destacado,
    c.nombre as categoria_nombre,
    s.nombre as subcategoria_nombre
FROM menu m
JOIN categoria c ON m.categoria_id = c.id
LEFT JOIN subcategoria s ON m.subcategoria_id = s.id
WHERE m.activo = 1
    AND m.deleted_at IS NULL
    AND c.activo = 1;

CREATE VIEW IF NOT EXISTS view_repartidores_disponibles AS
SELECT
    pe.id,
    pe.nombre,
    pe.apellido,
    pe.telefono,
    pe.email,
    v.nombre as vehiculo_nombre,
    v.matricula
FROM personal_entrega pe
LEFT JOIN vehiculos v ON pe.vehiculo_id = v.id
WHERE pe.disponibilidad = 1
    AND pe.laborando = 1
    AND (v.estado = 'Disponible' OR v.id IS NULL);
