import { useState, useEffect } from "react";
import { Search, Sparkles, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import Header from "./components/Header";
import ClienteForm from "./components/ClienteForm";
import ProductAccordion from "./components/ProductAccordion";
import FooterResumen from "./components/FooterResumen";
import HistorialPedidos from "./components/HistorialPedidos";
import { Product, Client, Cart } from "./types";

const URL_DATA = "https://docs.google.com/spreadsheets/d/1pUkyu4Ji4cZYXe0XJ4RghB1p1N3T1cYemZZ4cp8GYmk/gviz/tq?tqx=out:json";
const CLIENTES_URL = "https://docs.google.com/spreadsheets/d/1odxmYGU1tsPSAbL4DDJg1_bedbn0Fqec/gviz/tq?tqx=out:json&sheet=Hoja 1";

const STORAGE_KEYS = {
  CART: "bonappetit_carrito",
  CLIENT_NAME: "bonappetit_nombre",
  CLIENT_PHONE: "bonappetit_telefono",
  PRODUCTS_CACHE: "bonappetit_productos_cache",
  PRODUCTS_CACHE_TIME: "bonappetit_cache_time",
  CLIENTS_CACHE: "bonappetit_clientes_cache",
  CLIENTS_CACHE_TIME: "bonappetit_clientes_cache_time",
};

const CACHE_DURATION = 3600000; // 1 hour in ms

export default function App() {
  // Client States
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");
  const [entrega, setEntrega] = useState("Delivery");
  const [observaciones, setObservaciones] = useState("");

  // Search, Products, Autocomplete lists
  const [buscar, setBuscar] = useState("");
  const [productosPorCategoria, setProductosPorCategoria] = useState<Record<string, Product[]>>({});
  const [carrito, setCarrito] = useState<Cart>({});
  const [clientesList, setClientesList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstantBadge, setShowInstantBadge] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState("todos");
  const [showHistorial, setShowHistorial] = useState(false);

  // 1. Initial State Loading & Query Params Router
  useEffect(() => {
    // Restore Saved Cart
    const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
    if (savedCart) {
      try {
        setCarrito(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart", e);
      }
    }

    // Restore Saved Client Profile (persistent inputs)
    const savedName = localStorage.getItem(STORAGE_KEYS.CLIENT_NAME);
    const savedPhone = localStorage.getItem(STORAGE_KEYS.CLIENT_PHONE);
    if (savedName) setNombre(savedName);
    if (savedPhone) setTelefono(savedPhone);

    // Read URL Parameters for routing / pre-fill triggers (e.g. ?cliente=Nombre)
    const params = new URLSearchParams(window.location.search);
    const urlCliente = params.get("cliente");
    if (urlCliente) {
      const decoded = decodeURIComponent(urlCliente);
      setNombre(decoded);
    }
  }, []);

  // Sync Input modifications with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_NAME, nombre);
  }, [nombre]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_PHONE, telefono);
  }, [telefono]);

  // 2. Fetch Clients & Autocomplete details
  const cargarClientes = async () => {
    const cachedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS_CACHE);
    const cachedTime = localStorage.getItem(STORAGE_KEYS.CLIENTS_CACHE_TIME);

    if (cachedClients && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_DURATION)) {
      setClientesList(JSON.parse(cachedClients));
      return;
    }

    try {
      const res = await fetch(CLIENTES_URL);
      if (!res.ok) throw new Error("Network response not OK");
      const text = await res.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\)/);
      if (!match) throw new Error("Invalid format parsing Clients Sheet");
      
      const parsed = JSON.parse(match[1]);
      const rows = parsed.table.rows;
      const parsedClients: Client[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row.c) continue;

        const id = row.c[0] ? String(row.c[0].v) : "";
        const clientName = row.c[1] ? String(row.c[1].v) : "";
        const rifCedula = row.c[2] ? String(row.c[2].v) : "";
        const clientDir = row.c[3] ? String(row.c[3].v) : "";
        const clientTel = row.c[4] ? String(row.c[4].v) : "";
        const clientContact = row.c[5] ? String(row.c[5].v) : "";

        if (clientName && clientTel) {
          parsedClients.push({
            id,
            cliente: clientName,
            rifCedula,
            direccion: clientDir,
            telefonos: clientTel,
            contacto: clientContact,
          });
        }
      }

      setClientesList(parsedClients);
      localStorage.setItem(STORAGE_KEYS.CLIENTS_CACHE, JSON.stringify(parsedClients));
      localStorage.setItem(STORAGE_KEYS.CLIENTS_CACHE_TIME, String(Date.now()));
    } catch (err) {
      console.warn("Could not retrieve clients list. Local autocompletion may be blank.", err);
    }
  };

  // Helper utility to safely parse and group sheet records
  const parseGoogleSheetProducts = (text: string): Record<string, Product[]> => {
    const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\)/);
    if (!match) throw new Error("Respuesta de hoja de cálculo en formato incompatible");

    const parsed = JSON.parse(match[1]);
    const rows = parsed.table.rows;
    const groups: Record<string, Product[]> = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.c) continue;

      const desc = row.c[1] ? String(row.c[1].v).trim() : null;
      const priceVal = row.c[2] ? parseFloat(row.c[2].v) : 0;
      let category = row.c[4] ? String(row.c[4].v).trim().toLowerCase() : "otros";

      if (!category) {
        category = "otros";
      }

      if (desc && priceVal > 0 && desc !== "Descripción") {
        const id = btoa(`${category}|${desc}|${priceVal}`).replace(/[^a-zA-Z0-9]/g, "_");

        if (!groups[category]) {
          groups[category] = [];
        }

        groups[category].push({
          id,
          nombre: desc,
          precio: priceVal,
          categoria: category,
        });
      }
    }

    return groups;
  };

  // 3. Fetch Products from sheet & update cache
  const cargarProductos = async () => {
    setLoading(true);
    setError(null);

    const cachedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE);
    const cachedTime = localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE_TIME);

    // If cache is fresh, render immediately for premium offline-like speed
    if (cachedProds && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_DURATION)) {
      try {
        const parsed = JSON.parse(cachedProds);
        setProductosPorCategoria(parsed);
        setLoading(false);
        triggerCacheBadge();
        // Update cache quietly behind the scenes to keep data in sync
        sincronizarEnSegundoPlano();
        return;
      } catch (e) {
        console.error("Error loading product cache", e);
      }
    }

    try {
      const res = await fetch(URL_DATA);
      if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
      const text = await res.text();
      
      const parsedGroups = parseGoogleSheetProducts(text);
      setProductosPorCategoria(parsedGroups);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE, JSON.stringify(parsedGroups));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE_TIME, String(Date.now()));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al obtener respuestas del catálogo remoto");
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar en segundo plano allows users to view cached items instantly while refreshing quietly
  const sincronizarEnSegundoPlano = async () => {
    try {
      const res = await fetch(URL_DATA);
      if (res.ok) {
        const text = await res.text();
        const parsedGroups = parseGoogleSheetProducts(text);
        setProductosPorCategoria(parsedGroups);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE, JSON.stringify(parsedGroups));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE_TIME, String(Date.now()));
        console.log("Inventario sincronizado silenciosamente en segundo plano");
      }
    } catch (e) {
      console.log("Falla silenciosa en segundo plano (ignorable):", e);
    }
  };

  const triggerCacheBadge = () => {
    setShowInstantBadge(true);
    setTimeout(() => {
      setShowInstantBadge(false);
    }, 2500);
  };

  useEffect(() => {
    cargarClientes();
    cargarProductos();
  }, []);

  // Cart action dispatcher: increment or decrement quantity
  const handleCantidadChange = (
    id: string,
    nombre: string,
    precio: number,
    categoria: string,
    cambio: number
  ) => {
    setCarrito((prev) => {
      const item = prev[id];
      const nuevaCantidad = (item ? item.cantidad : 0) + cambio;
      const nuevoCarrito = { ...prev };

      if (nuevaCantidad <= 0) {
        delete nuevoCarrito[id];
      } else {
        nuevoCarrito[id] = { nombre, cantidad: nuevaCantidad, precio, categoria };
      }

      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  // Completely reset states on success
  const handleSuccessReset = () => {
    // Clear cart memory
    setCarrito({});
    localStorage.removeItem(STORAGE_KEYS.CART);

    // Empty fields & memory
    setNombre("");
    setTelefono("");
    setDireccion("");
    setContacto("");
    setObservaciones("");
    setBuscar("");
    setFiltroRapido("todos");
    localStorage.removeItem(STORAGE_KEYS.CLIENT_NAME);
    localStorage.removeItem(STORAGE_KEYS.CLIENT_PHONE);
  };

  const handleLoadCart = (newCart: Cart) => {
    setCarrito(newCart);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart));
  };

  const handleClearSearch = () => {
    setBuscar("");
    setFiltroRapido("todos");
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-[#eee9d5]/30 my-6 relative transition-transform duration-300">
      {/* Header component */}
      <Header />

          {/* Main Content Area */}
          <main className="p-5 md:p-6 pb-2">
            
            {/* Control Panel: History & System Reset */}
            <div className="flex items-center gap-2.5 mb-5">
              <button
                id="btnAbrirHistorial"
                onClick={() => setShowHistorial(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#3e2723]/5 hover:bg-[#3e2723]/10 text-[#3e2723] border border-[#3e2723]/10 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                title="Ver historial de pedidos guardadosLocalmente en este navegador"
              >
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Historial de Pedidos</span>
              </button>

              <button
                id="btnRestablecerTodo"
                onClick={() => {
                  if (window.confirm("⚠️ ¿Estás seguro de que deseas restablecer la aplicación y borrar TODOS los datos guardados en LocalStorage (incluyendo el carrito, historial, clientes y caché)? Esta acción reiniciará la app como nueva.")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                title="Borrar localStorage y caché de la App"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Restablecer App</span>
              </button>
            </div>

            {/* Client Metadata Form */}
            <ClienteForm
              nombre={nombre}
              setNombre={setNombre}
              telefono={telefono}
              setTelefono={setTelefono}
              direccion={direccion}
              setDireccion={setDireccion}
              contacto={contacto}
              setContacto={setContacto}
              entrega={entrega}
              setEntrega={setEntrega}
              observaciones={observaciones}
              setObservaciones={setObservaciones}
              clientesList={clientesList}
            />

            {/* Dynamic Search Box */}
            <div className="relative mb-4">
              <input
                type="text"
                id="txtBuscar"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                disabled={loading}
                placeholder="Buscar especia, condimento o hierba..."
                className="w-full pl-12 pr-4 py-3.5 border-[1.5px] border-[#d2b48c] focus:border-amber-500 rounded-full text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 placeholder-stone-400 outline-none disabled:bg-stone-50 disabled:cursor-not-allowed"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 focus-within:text-amber-500 transition-colors" />
            </div>

            {/* Scrollable Rapid Filter Badges */}
            <div className="flex gap-1.5 overflow-x-auto pb-4 mb-2 -mx-1 px-1 scrollbar-thin">
              {[
                { id: "todos", label: "Todos ✨" },
                { id: "picantes", label: "Picantes 🌶️" },
                { id: "hierbas", label: "Hierbas 🌿" },
                { id: "semillas", label: "Semillas 🌰" },
                { id: "reposteria", label: "Repostería 🍰" },
                { id: "economicos", label: "Hasta $3 🏷️" },
              ].map((pill) => {
                const isActive = filtroRapido === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setFiltroRapido(pill.id)}
                    className={`text-xs py-2 px-3.5 rounded-full font-bold whitespace-nowrap transition-all duration-200 outline-none cursor-pointer ${
                      isActive
                        ? "bg-[#3e2723] text-amber-100 shadow-sm font-extrabold"
                        : "bg-amber-50/40 hover:bg-amber-50/80 text-[#3e2723]/70 border border-amber-800/10"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Product listing grouped in accordions */}
            <ProductAccordion
              productosPorCategoria={productosPorCategoria}
              carrito={carrito}
              onCantidadChange={handleCantidadChange}
              buscar={buscar}
              filtroRapido={filtroRapido}
              loading={loading}
              error={error}
              onRetry={cargarProductos}
            />
          </main>

          {/* Historial Panel Modal */}
          <HistorialPedidos
            onLoadCart={handleLoadCart}
            isOpen={showHistorial}
            onClose={() => setShowHistorial(false)}
          />

          {/* Cart Summary & Order Placement button */}
          <FooterResumen
            carrito={carrito}
            nombre={nombre}
            telefono={telefono}
            direccion={direccion}
            contacto={contacto}
            entrega={entrega}
            observaciones={observaciones}
            onSuccessReset={handleSuccessReset}
          />

          {/* Offline cache loaded badge overlay */}
          {showInstantBadge && (
            <div className="fixed bottom-6 right-6 bg-[#3e2723] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold select-none animate-bounce z-[100] border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>¡Carga instantánea activa!</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}
        </div>
  );
}
