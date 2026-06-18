import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Sparkles, 
  Leaf, 
  CakeSlice, 
  FlaskConical, 
  Package, 
  Plus, 
  Minus, 
  AlertCircle, 
  RotateCw 
} from "lucide-react";
import { Product, Cart } from "../types";

interface ProductAccordionProps {
  productosPorCategoria: Record<string, Product[]>;
  carrito: Cart;
  onCantidadChange: (
    id: string, 
    nombre: string, 
    precio: number, 
    categoria: string, 
    cambio: number
  ) => void;
  buscar: string;
  filtroRapido?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

// Category Icons Mapping
const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase().trim();
  if (c.includes("condimento")) return <Sparkles className="w-5 h-5 text-amber-500" />;
  if (c.includes("especi") || c.includes("hierba")) return <Leaf className="w-5 h-5 text-emerald-500" />;
  if (c.includes("repost") || c.includes("pasteler")) return <CakeSlice className="w-5 h-5 text-rose-400" />;
  if (c.includes("quimic")) return <FlaskConical className="w-5 h-5 text-blue-500" />;
  return <Package className="w-5 h-5 text-amber-600" />;
};

export default function ProductAccordion({
  productosPorCategoria,
  carrito,
  onCantidadChange,
  buscar,
  filtroRapido = "todos",
  loading,
  error,
  onRetry,
}: ProductAccordionProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  // Helper utility for normalizing strings (accents, lowercase, etc.)
  const normalizarTexto = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const searchLower = normalizarTexto(buscar);

  // Automatically expand accordions if user is typing in the search bar or has an active filter
  useEffect(() => {
    if (searchLower.trim() !== "" || filtroRapido !== "todos") {
      const activeStates: Record<string, boolean> = {};
      Object.keys(productosPorCategoria).forEach((cat) => {
        const hasMatch = productosPorCategoria[cat]?.some((p) => {
          const cumpleBusqueda = searchLower === "" ? true : normalizarTexto(p.nombre).includes(searchLower);
          if (!cumpleBusqueda) return false;

          if (filtroRapido === "todos") return true;

          const nNombre = normalizarTexto(p.nombre);
          const nCat = normalizarTexto(p.categoria);

          if (filtroRapido === "picantes") {
            return nNombre.includes("picante") || nNombre.includes("aji") || nNombre.includes("pimienta") || nNombre.includes("merquen") || nNombre.includes("chile") || nNombre.includes("cayena");
          }
          if (filtroRapido === "hierbas") {
            return nNombre.includes("hierba") || nNombre.includes("oregano") || nNombre.includes("albahaca") || nNombre.includes("perejil") || nNombre.includes("romero") || nNombre.includes("tomillo") || nNombre.includes("menta") || nNombre.includes("laurel") || nNombre.includes("hojas");
          }
          if (filtroRapido === "semillas") {
            return nNombre.includes("semilla") || nNombre.includes("grano") || nNombre.includes("sesamo") || nNombre.includes("ajonjoli") || nNombre.includes("mostaza") || nNombre.includes("comino") || nNombre.includes("hinojo") || nNombre.includes("chia") || nNombre.includes("mani") || nNombre.includes("nuez");
          }
          if (filtroRapido === "reposteria") {
            return nCat.includes("reposteria") || nCat.includes("pasteleria") || nNombre.includes("canela") || nNombre.includes("vainilla") || nNombre.includes("azucar") || nNombre.includes("cacao") || nNombre.includes("colorante") || nNombre.includes("esencia");
          }
          if (filtroRapido === "economicos") {
            return p.precio <= 3.00;
          }
          return true;
        });

        if (hasMatch) {
          activeStates[cat] = true;
        }
      });
      setOpenStates((prev) => ({ ...prev, ...activeStates }));
    }
  }, [buscar, productosPorCategoria, filtroRapido]);

  const toggleAccordion = (category: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Rendering shimmering skeletons for premium UX loading state
  if (loading) {
    return (
      <div className="space-y-4 py-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white border border-amber-500/10 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-1/3 bg-amber-500/10 rounded-md animate-pulse" />
              <div className="h-5 w-5 bg-amber-500/10 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 pt-2 border-t border-amber-500/5">
              <div className="h-4 w-5/6 bg-amber-500/5 rounded-md animate-pulse" />
              <div className="h-4 w-4/6 bg-amber-500/5 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Displaying error state gracefully with a retry loop
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-rose-500/10 rounded-3xl shadow-sm text-rose-900 mb-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3 stroke-[1.5]" />
        <p className="font-bold text-sm tracking-wide">Error al sincronizar inventario</p>
        <p className="text-xs text-rose-800/70 mt-1 max-w-xs">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold text-xs rounded-full shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Sincronizar inventario
        </button>
      </div>
    );
  }

  const keys = Object.keys(productosPorCategoria);

  if (keys.length === 0) {
    return (
      <div className="text-center p-10 text-amber-800/60 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/20">
        <Package className="w-10 h-10 mx-auto text-amber-700/55 mb-2" />
        <p className="text-sm font-semibold">No se encontraron productos disponibles.</p>
        <p className="text-xs mt-1">Intente refrescar o contacte a soporte.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {keys.map((categoria) => {
        const productos = productosPorCategoria[categoria] || [];
        
        // Filter products locally as specified by input & active rapid filter
        const productosFiltrados = productos.filter((p) => {
          const cumpleBusqueda = searchLower === "" ? true : normalizarTexto(p.nombre).includes(searchLower);
          if (!cumpleBusqueda) return false;

          if (filtroRapido === "todos") return true;

          const nNombre = normalizarTexto(p.nombre);
          const nCat = normalizarTexto(p.categoria);

          if (filtroRapido === "picantes") {
            return nNombre.includes("picante") || nNombre.includes("aji") || nNombre.includes("pimienta") || nNombre.includes("merquen") || nNombre.includes("chile") || nNombre.includes("cayena");
          }
          if (filtroRapido === "hierbas") {
            return nNombre.includes("hierba") || nNombre.includes("oregano") || nNombre.includes("albahaca") || nNombre.includes("perejil") || nNombre.includes("romero") || nNombre.includes("tomillo") || nNombre.includes("menta") || nNombre.includes("laurel") || nNombre.includes("hojas");
          }
          if (filtroRapido === "semillas") {
            return nNombre.includes("semilla") || nNombre.includes("grano") || nNombre.includes("sesamo") || nNombre.includes("ajonjoli") || nNombre.includes("mostaza") || nNombre.includes("comino") || nNombre.includes("hinojo") || nNombre.includes("chia") || nNombre.includes("mani") || nNombre.includes("nuez");
          }
          if (filtroRapido === "reposteria") {
            return nCat.includes("reposteria") || nCat.includes("pasteleria") || nNombre.includes("canela") || nNombre.includes("vainilla") || nNombre.includes("azucar") || nNombre.includes("cacao") || nNombre.includes("colorante") || nNombre.includes("esencia");
          }
          if (filtroRapido === "economicos") {
            return p.precio <= 3.00;
          }
          return true;
        });

        // Do not display is there are no search items in category
        if (productosFiltrados.length === 0) return null;

        const isOpen = !!openStates[categoria];
        const displayCategory = categoria.charAt(0).toUpperCase() + categoria.slice(1);

        return (
          <div 
            key={categoria} 
            className="border border-[#eee9d0] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-amber-500/20 bg-white transition-all duration-300"
            id={`category-wrapper-${categoria}`}
          >
            {/* Accordion Trigger Header */}
            <button
              onClick={() => toggleAccordion(categoria)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-white to-[#fefcf8] cursor-pointer hover:from-[#fefcf8] hover:to-[#fffbf0] transition-colors focus:outline-none"
              id={`category-header-${categoria}`}
            >
              <h3 className="font-display font-bold text-lg text-[#3e2723] flex items-center gap-3">
                {getCategoryIcon(categoria)}
                {displayCategory}
              </h3>
              <ChevronDown 
                className={`w-5 h-5 text-[#bcaaa4] transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-amber-500" : ""
                }`} 
              />
            </button>

            {/* Accordion Rows Panel with expandable heights */}
            <div 
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[800px] border-t border-amber-500/5 overflow-y-auto" : "max-h-0 overflow-hidden"
              }`}
            >
              <div id={`category-panel-${categoria}`} className="divide-y divide-[#f7f3eb]">
                {productosFiltrados.map((prod) => {
                  const itemCarrito = carrito[prod.id];
                  const cantidad = itemCarrito ? itemCarrito.cantidad : 0;

                  return (
                    <div 
                      key={prod.id} 
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-[#fffcf5] border-l-3 border-transparent hover:border-amber-500 transition-all duration-200"
                      id={`product-row-${prod.id}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-bold text-[#3e2723] truncate">
                          {prod.nombre}
                        </div>
                        <div className="text-sm text-amber-700 font-extrabold mt-0.5">
                          ${prod.precio.toFixed(2)}
                        </div>
                      </div>

                      {/* Quantity Selection Controller */}
                      <div className="flex items-center gap-1.5 bg-[#f5efe5] p-1 rounded-full shadow-xs">
                        <button
                          onClick={() => onCantidadChange(prod.id, prod.nombre, prod.precio, categoria, -1)}
                          className="w-8 h-8 rounded-full border-none bg-white flex items-center justify-center text-sm font-black text-[#3e2723] cursor-pointer hover:bg-amber-500 hover:text-white transition-all shadow-xs shrink-0 active:scale-90"
                          id={`btn-minus-${prod.id}`}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        
                        <span 
                          className="text-sm font-extrabold min-w-[32px] text-center text-[#3e2723]"
                          id={`qty-${prod.id}`}
                        >
                          {cantidad}
                        </span>

                        <button
                          onClick={() => onCantidadChange(prod.id, prod.nombre, prod.precio, categoria, 1)}
                          className="w-8 h-8 rounded-full border-none bg-white flex items-center justify-center text-sm font-black text-[#3e2723] cursor-pointer hover:bg-amber-500 hover:text-white transition-all shadow-xs shrink-0 active:scale-95"
                          id={`btn-plus-${prod.id}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
