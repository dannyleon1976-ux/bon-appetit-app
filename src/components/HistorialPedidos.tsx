import React, { useState } from "react";
import { HistoryOrder, Cart } from "../types";
import { Clock, X, Trash2, RotateCcw, ChevronDown, ChevronUp, ShoppingBag, Eye } from "lucide-react";

interface HistorialPedidosProps {
  onLoadCart: (newCart: Cart) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistorialPedidos({
  onLoadCart,
  isOpen,
  onClose,
}: HistorialPedidosProps) {
  const [historial, setHistorial] = useState<HistoryOrder[]>(() => {
    try {
      const saved = localStorage.getItem("bonappetit_historial");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const eliminarPedido = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Está seguro de que desea eliminar este pedido del historial?")) {
      const nuevoHistorial = historial.filter((item) => item.id !== id);
      setHistorial(nuevoHistorial);
      localStorage.setItem("bonappetit_historial", JSON.stringify(nuevoHistorial));
    }
  };

  const vaciarHistorial = () => {
    if (window.confirm("¿Está seguro de que desea eliminar TODO el historial de pedidos?")) {
      setHistorial([]);
      localStorage.removeItem("bonappetit_historial");
    }
  };

  const cargarAlCarrito = (pedido: HistoryOrder) => {
    if (window.confirm(`¿Desea reemplazar el carrito actual con los productos de este pedido (${pedido.items.length} ítems)?`)) {
      // Reconstruct Cart format (Record<string, CartItem>)
      const newCart: Cart = {};
      pedido.items.forEach((item) => {
        // Base64 ID generator matching the Excel source formula:
        const id = btoa(`${item.categoria}|${item.nombre}|${item.precio}`).replace(/[^a-zA-Z0-9]/g, "_");
        newCart[id] = {
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          categoria: item.categoria,
        };
      });

      onLoadCart(newCart);
      alert("🛒 ¡Carrito cargado con éxito desde el historial!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3e2723]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-500/10 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-amber-500/10 flex items-center justify-between bg-gradient-to-r from-[#fffbf5] to-[#fff5e6]">
          <h2 className="font-display font-bold text-lg text-[#3e2723] flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            Historial de Pedidos
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {historial.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Clock className="w-12 h-12 mx-auto text-stone-300 stroke-[1.2] mb-3" />
              <p className="font-semibold text-sm">No hay pedidos guardados aún.</p>
              <p className="text-xs text-stone-400 mt-1">Los pedidos enviados por WhatsApp se guardarán automáticamente aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-stone-500 font-bold">
                  {historial.length} pedidos registrados
                </span>
                <button
                  onClick={vaciarHistorial}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar historial
                </button>
              </div>

              {historial.map((pedido) => {
                const isExpanded = expandedId === pedido.id;
                return (
                  <div
                    key={pedido.id}
                    className="border border-[#eee9d5] rounded-2xl bg-white hover:border-amber-500/20 transition-all overflow-hidden shadow-xs cursor-pointer"
                    onClick={() => toggleExpand(pedido.id)}
                  >
                    {/* Header Row of Past Order Card */}
                    <div className="p-4 flex justify-between items-start gap-2 hover:bg-amber-50/20">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-[#3e2723] truncate max-w-[200px]">
                          🏢 {pedido.cliente}
                        </h4>
                        <div className="text-[10px] text-stone-500 font-semibold">
                          📅 {pedido.fecha}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="font-extrabold text-sm text-amber-800">
                          ${pedido.total.toFixed(2)}
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => cargarAlCarrito(pedido)}
                            title="Recargar pedido en el carrito"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => eliminarPedido(pedido.id, e)}
                            title="Eliminar de historial"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible details pane */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-dashed border-[#f2edd8] bg-[#fffdfb]">
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-black mb-2 uppercase tracking-wide">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Detalle de Productos
                        </div>
                        <div className="divide-y divide-[#eee9d5]/30 text-xs">
                          {pedido.items.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between gap-2">
                              <span className="text-stone-700 font-semibold line-clamp-1 flex-1">
                                🌿 {item.nombre}
                              </span>
                              <span className="text-stone-500 text-right min-w-[70px]">
                                {item.cantidad} x ${item.precio.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-amber-500/5 text-center">
          <p className="text-[10px] text-stone-500 font-semibold">
            Bon Appetit · El Gustazo - Pedidos 100% Offline
          </p>
        </div>
      </div>
    </div>
  );
}
