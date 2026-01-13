'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Star,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  ruta_imagen: string | null;
  destacado: number;
  tiempo_preparacion: number;
  categoria_nombre: string;
  subcategoria_nombre: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function ClienteMenuPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchData();
    loadCart();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchTerm, selectedCategoria, menuItems]);

  function loadCart() {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }

  function saveCart(newCart: CartItem[]) {
    localStorage.setItem('restaurant_cart', JSON.stringify(newCart));
    setCart(newCart);
    // Dispatch event to update header cart count
    window.dispatchEvent(new Event('storage'));
  }

  async function fetchData() {
    try {
      const [categoriasRes, menuRes] = await Promise.all([
        fetch('/api/categorias'),
        fetch('/api/menu'),
      ]);

      if (categoriasRes.ok) {
        const data = await categoriasRes.json();
        setCategorias(data.categorias || []);
      }

      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.menu || []);
        setFilteredItems(data.menu || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterItems() {
    let filtered = menuItems;

    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(
        (item) => item.categoria_nombre === selectedCategoria
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nombre.toLowerCase().includes(term) ||
          item.descripcion?.toLowerCase().includes(term)
      );
    }

    setFilteredItems(filtered);
  }

  function addToCart(item: MenuItem) {
    const existingIndex = cart.findIndex((c) => c.id === item.id);
    let newCart: CartItem[];

    if (existingIndex >= 0) {
      newCart = cart.map((c, i) =>
        i === existingIndex ? { ...c, cantidad: c.cantidad + 1 } : c
      );
    } else {
      newCart = [
        ...cart,
        {
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
        },
      ];
    }

    saveCart(newCart);
  }

  function removeFromCart(itemId: number) {
    const existingIndex = cart.findIndex((c) => c.id === itemId);
    if (existingIndex < 0) return;

    let newCart: CartItem[];
    const item = cart[existingIndex];

    if (item.cantidad > 1) {
      newCart = cart.map((c, i) =>
        i === existingIndex ? { ...c, cantidad: c.cantidad - 1 } : c
      );
    } else {
      newCart = cart.filter((c) => c.id !== itemId);
    }

    saveCart(newCart);
  }

  function getCartQuantity(itemId: number): number {
    const item = cart.find((c) => c.id === itemId);
    return item?.cantidad || 0;
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Group featured items
  const featuredItems = menuItems.filter((item) => item.destacado === 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuestro Menú</h1>
          <p className="text-gray-500 mt-1">
            Explora nuestra deliciosa selección de platillos
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar platillos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Featured Section */}
      {featuredItems.length > 0 && selectedCategoria === 'all' && !searchTerm && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Destacados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.slice(0, 3).map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={getCartQuantity(item.id)}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
                featured
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Tabs */}
      <Tabs value={selectedCategoria} onValueChange={setSelectedCategoria}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-full px-4"
          >
            Todos
          </TabsTrigger>
          {categorias.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.nombre}
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-full px-4"
            >
              {cat.nombre}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategoria} className="mt-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron platillos
              </h3>
              <p className="text-gray-500">
                Intenta con otro término de búsqueda o categoría
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getCartQuantity(item.id)}
                  onAdd={() => addToCart(item)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-xl px-6"
          >
            <a href="/cliente/carrito" className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              <span>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
  featured = false,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  featured?: boolean;
}) {
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', featured && 'ring-2 ring-orange-500')}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
        {item.ruta_imagen ? (
          <img
            src={item.ruta_imagen}
            alt={item.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🍽️
          </div>
        )}
        {featured && (
          <Badge className="absolute top-3 left-3 bg-orange-600">
            <Star className="h-3 w-3 mr-1 fill-white" />
            Destacado
          </Badge>
        )}
        {item.subcategoria_nombre && (
          <Badge variant="secondary" className="absolute top-3 right-3">
            {item.subcategoria_nombre}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900">{item.nombre}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {item.descripcion || 'Delicioso platillo de nuestra cocina'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4" />
          <span>{item.tiempo_preparacion} min</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-orange-600">
            ${item.precio.toFixed(2)}
          </span>

          {quantity === 0 ? (
            <Button
              onClick={onAdd}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onRemove}
                className="h-9 w-9"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <Button
                size="icon"
                onClick={onAdd}
                className="h-9 w-9 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
