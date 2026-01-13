'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSocket } from '@/lib/socket/client';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  CreditCard,
  Truck,
  Store,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Ciudad {
  id: number;
  nombre: string;
  estado: string;
}

interface Municipio {
  id: number;
  nombre: string;
}

export default function CarritoPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'success'>('cart');
  const [orderNumber, setOrderNumber] = useState('');

  // Form state
  const [tipoEntrega, setTipoEntrega] = useState<'Delivery' | 'Recogida'>('Delivery');
  const [ciudadId, setCiudadId] = useState<string>('');
  const [municipioId, setMunicipioId] = useState<string>('');
  const [calle, setCalle] = useState('');
  const [residencia, setResidencia] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');

  useEffect(() => {
    loadCart();
    fetchCiudades();
    loadUserData();
  }, []);

  useEffect(() => {
    if (ciudadId) {
      fetchMunicipios(ciudadId);
    }
  }, [ciudadId]);

  function loadCart() {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }

  function saveCart(newCart: CartItem[]) {
    localStorage.setItem('restaurant_cart', JSON.stringify(newCart));
    setCart(newCart);
  }

  async function loadUserData() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setNombreCliente(data.user.nombre);
        setTelefonoCliente(data.user.telefono || '');
        if (data.user.ciudad_id) {
          setCiudadId(String(data.user.ciudad_id));
        }
        if (data.user.municipio_id) {
          setMunicipioId(String(data.user.municipio_id));
        }
        if (data.user.calle) {
          setCalle(data.user.calle);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async function fetchCiudades() {
    try {
      const response = await fetch('/api/ubicaciones/ciudades');
      if (response.ok) {
        const data = await response.json();
        setCiudades(data.ciudades || []);
      }
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  }

  async function fetchMunicipios(ciudadId: string) {
    try {
      const response = await fetch(`/api/ubicaciones/municipios?ciudad_id=${ciudadId}`);
      if (response.ok) {
        const data = await response.json();
        setMunicipios(data.municipios || []);
      }
    } catch (error) {
      console.error('Error fetching municipios:', error);
    }
  }

  function updateQuantity(itemId: number, delta: number) {
    const newCart = cart
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.cantidad + delta;
          return newQty > 0 ? { ...item, cantidad: newQty } : null;
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    saveCart(newCart);
  }

  function removeItem(itemId: number) {
    const newCart = cart.filter((item) => item.id !== itemId);
    saveCart(newCart);
  }

  function clearCart() {
    localStorage.removeItem('restaurant_cart');
    setCart([]);
  }

  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const deliveryCost = tipoEntrega === 'Delivery' ? 5.0 : 0;
  const total = subtotal + deliveryCost;

  async function handleSubmitOrder() {
    if (!nombreCliente || !telefonoCliente) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (tipoEntrega === 'Delivery' && (!ciudadId || !calle || !residencia)) {
      alert('Por favor complete la dirección de entrega');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map((item) => ({
        menu_id: item.id,
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad,
      }));

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoEntrega,
          ciudad_id: ciudadId ? parseInt(ciudadId) : null,
          municipio_id: municipioId ? parseInt(municipioId) : null,
          calle: calle || 'Recogida en local',
          residencia: residencia || 'Recogida en local',
          nombreCliente,
          telefonoCliente,
          descripcion,
          metodoPago,
          total,
          items,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderNumber(data.numero_pedido);

        // Emit socket event
        if (socket) {
          socket.emit('pedido:nuevo', {
            numero_pedido: data.numero_pedido,
            nombreCliente,
            total,
            tipoEntrega,
          });
        }

        clearCart();
        setStep('success');
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tu carrito está vacío
        </h1>
        <p className="text-gray-500 mb-6">
          Agrega algunos deliciosos platillos de nuestro menú
        </p>
        <Button
          onClick={() => router.push('/cliente/menu')}
          className="bg-gradient-to-r from-orange-500 to-red-600"
        >
          Ver Menú
        </Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pedido Confirmado
        </h1>
        <p className="text-gray-500 mb-2">
          Tu pedido ha sido recibido y está siendo procesado
        </p>
        <p className="text-xl font-bold text-orange-600 mb-6">
          Número de pedido: #{orderNumber}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/cliente/pedidos')}
          >
            Ver mis pedidos
          </Button>
          <Button
            onClick={() => router.push('/cliente/menu')}
            className="bg-gradient-to-r from-orange-500 to-red-600"
          >
            Seguir comprando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['cart', 'delivery', 'payment'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                step === s
                  ? 'bg-orange-600 text-white'
                  : i < ['cart', 'delivery', 'payment'].indexOf(step)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  'w-16 h-1 mx-2',
                  i < ['cart', 'delivery', 'payment'].indexOf(step)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Cart */}
      {step === 'cart' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Tu Carrito</h1>
            <Button variant="ghost" onClick={clearCart} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Vaciar carrito
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.nombre}</h3>
                        <p className="text-orange-600 font-bold">${item.precio.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.cantidad}</span>
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-orange-600"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-600">${subtotal.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                  onClick={() => setStep('delivery')}
                >
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step: Delivery */}
      {step === 'delivery' && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setStep('cart')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al carrito
          </Button>

          <h1 className="text-2xl font-bold text-gray-900">Tipo de Entrega</h1>

          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className={cn(
                'cursor-pointer transition-all',
                tipoEntrega === 'Delivery' && 'ring-2 ring-orange-500'
              )}
              onClick={() => setTipoEntrega('Delivery')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Delivery</h3>
                  <p className="text-sm text-gray-500">Entrega a domicilio (+$5.00)</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                'cursor-pointer transition-all',
                tipoEntrega === 'Recogida' && 'ring-2 ring-orange-500'
              )}
              onClick={() => setTipoEntrega('Recogida')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Recogida</h3>
                  <p className="text-sm text-gray-500">Recoge en el local</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {tipoEntrega === 'Delivery' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ciudad *</Label>
                    <Select value={ciudadId} onValueChange={setCiudadId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {ciudades.map((ciudad) => (
                          <SelectItem key={ciudad.id} value={String(ciudad.id)}>
                            {ciudad.nombre}, {ciudad.estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Municipio</Label>
                    <Select value={municipioId} onValueChange={setMunicipioId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un municipio" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios.map((mun) => (
                          <SelectItem key={mun.id} value={String(mun.id)}>
                            {mun.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Calle / Avenida *</Label>
                  <Input
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    placeholder="Ej: Av. Principal, Calle 5..."
                  />
                </div>
                <div>
                  <Label>Residencia / Edificio / Casa *</Label>
                  <Input
                    value={residencia}
                    onChange={(e) => setResidencia(e.target.value)}
                    placeholder="Ej: Edificio Torre Sol, Apto 4B"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={telefonoCliente}
                    onChange={(e) => setTelefonoCliente(e.target.value)}
                    placeholder="Tu teléfono"
                  />
                </div>
              </div>
              <div>
                <Label>Notas adicionales</Label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Instrucciones especiales, alergias, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-600"
              onClick={() => setStep('payment')}
            >
              Continuar al pago
            </Button>
          </div>
        </div>
      )}

      {/* Step: Payment */}
      {step === 'payment' && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setStep('delivery')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <h1 className="text-2xl font-bold text-gray-900">Método de Pago</h1>

          <div className="grid md:grid-cols-2 gap-4">
            {['Efectivo', 'Divisa', 'Tarjeta', 'Pago Movil'].map((method) => (
              <Card
                key={method}
                className={cn(
                  'cursor-pointer transition-all',
                  metodoPago === method && 'ring-2 ring-orange-500'
                )}
                onClick={() => setMetodoPago(method)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{method}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span className="font-medium">${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {tipoEntrega === 'Delivery' && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>${deliveryCost.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span className="text-orange-600">${total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-lg"
                onClick={handleSubmitOrder}
                disabled={loading}
              >
                {loading ? 'Procesando...' : `Confirmar Pedido - $${total.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
