import { ShoppingCart, Trash2 } from "lucide-react";
import { Cart } from "../types";

interface FooterResumenProps {
  carrito: Cart;
  nombre: string;
  telefono: string;
  direccion: string;
  contacto: string;
  entrega: string;
  observaciones: string;
  onSuccessReset: () => void;
}

export default function FooterResumen({
  carrito,
  nombre,
  telefono,
  direccion,
  contacto,
  entrega,
  observaciones,
  onSuccessReset,
}: FooterResumenProps) {
  
  // Calculate total price in client code
  const total = Object.values(carrito).reduce(
    (acc, item) => acc + item.cantidad * item.precio,
    0
  );

  const validarTelefono = (tel: string) => {
    const soloNumeros = tel.replace(/[^0-9]/g, "");
    return soloNumeros.length >= 10;
  };

  const limpiarFormularioManual = () => {
    if (window.confirm("¿Está seguro de que desea limpiar todo el formulario y vaciar el carrito?")) {
      onSuccessReset();
    }
  };

  const enviarPedidoWhatsApp = () => {
    const nombreCliente = nombre.trim();
    const telefonoCliente = telefono.trim();
    const direccionCliente = direccion.trim();
    const contactoCliente = contacto.trim();
    const observacionesCliente = observaciones.trim();

    if (nombreCliente === "") {
      alert("✏️ Ingrese el nombre del cliente o negocio.");
      const input = document.getElementById("txtNombre");
      if (input) input.focus();
      return;
    }

    if (!validarTelefono(telefonoCliente)) {
      alert("📱 Ingrese un teléfono válido (mínimo 10 dígitos).");
      const input = document.getElementById("txtTelefono");
      if (input) input.focus();
      return;
    }

    const itemsKeys = Object.keys(carrito);
    if (itemsKeys.length === 0) {
      alert("🛒 Pedido vacío. Agregue productos.");
      return;
    }

    // Capture date
    const fecha = new Date();
    const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1} ${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;

    // WhatsApp Message Formatting
    let mensaje = `*BON APPETIT · EL GUSTAZO*\n`;
    mensaje += `─────────────────────────────\n`;
    mensaje += `🏢 *Cliente:* ${nombreCliente}\n`;
    mensaje += `📞 *Teléfono:* ${telefonoCliente}\n`;
    if (direccionCliente) mensaje += `📍 *Dirección:* ${direccionCliente}\n`;
    if (contactoCliente) mensaje += `👤 *Contacto:* ${contactoCliente}\n`;
    mensaje += `🚚 *Entrega:* ${entrega}\n`;
    mensaje += `📅 *Fecha:* ${fechaFormateada}\n`;
    
    if (observacionesCliente) {
      mensaje += `\n📝 *OBSERVACIONES:*\n${observacionesCliente}\n`;
    }
    
    mensaje += `─────────────────────────────\n`;
    mensaje += `*📦 DETALLE DEL PEDIDO*\n`;
    mensaje += `─────────────────────────────\n`;

    // Calculate maximum name length for tabular spacing
    let maxLen = 0;
    itemsKeys.forEach((key) => {
      const nombreLen = carrito[key].nombre.length;
      if (nombreLen > maxLen) maxLen = nombreLen;
    });
    maxLen = Math.min(maxLen, 22);

    // Append detail list
    itemsKeys.forEach((key) => {
      const item = carrito[key];
      const subtotal = Math.round(item.cantidad * item.precio * 100) / 100;
      const subtotalFormateado = subtotal.toFixed(2);
      const nombreItem = item.nombre;
      const cantidad = item.cantidad;
      const tildeSpaces = Math.max(1, maxLen - nombreItem.length + 2);
      const espacios = " ".repeat(tildeSpaces);
      
      mensaje += `🌿 ${nombreItem}${espacios}${cantidad}  $${subtotalFormateado}\n`;
    });

    mensaje += `─────────────────────────────\n`;
    mensaje += `💵 *TOTAL:* $${total.toFixed(2)}\n`;
    mensaje += `─────────────────────────────\n\n`;
    mensaje += `✅ *Pedido registrado*\n`;
    mensaje += `🙏 *Gracias por su compra*`;

    // Encode message and dispatch to the specified business WhatsApp phone
    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroTelefono = "584125820897"; // Venezuela custom dispatch line
    
    // Save order details to local history before resetting state
    try {
      const savedHistorial = localStorage.getItem("bonappetit_historial");
      const historial = savedHistorial ? JSON.parse(savedHistorial) : [];
      
      const nuevoPedido = {
        id: Date.now().toString(),
        fecha: fechaFormateada,
        cliente: nombreCliente,
        total: total,
        items: itemsKeys.map((key) => ({
          nombre: carrito[key].nombre,
          cantidad: carrito[key].cantidad,
          precio: carrito[key].precio,
          categoria: carrito[key].categoria,
        })),
      };
      
      historial.unshift(nuevoPedido);
      localStorage.setItem("bonappetit_historial", JSON.stringify(historial.slice(0, 50)));
    } catch (e) {
      console.error("Error saving order history:", e);
    }

    // Open in separate browser window/tab
    window.open(`https://wa.me/${numeroTelefono}?text=${mensajeCodificado}`, "_blank");

    // Success Callback to reset forms
    onSuccessReset();
    
    alert("✅ Pedido enviado correctamente.\n\nEl formulario se ha reiniciado para el próximo pedido.");
  };

  return (
    <div className="mt-8 border-t border-[#eee5d8] p-6 pb-8 bg-gradient-to-br from-white to-[#fefdfb] rounded-b-3xl">
      <div className="flex justify-between items-center bg-gradient-to-br from-[#fff8eb] to-[#fff5e8] p-5 rounded-2xl mb-5 border border-amber-500/20 shadow-xs">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#7a6f66]">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          Total Estimado:
        </span>
        <div className="text-3xl font-display font-extrabold bg-gradient-to-r from-[#3e2723] to-amber-600 bg-clip-text text-transparent">
          ${total.toFixed(2)}
        </div>
      </div>

      <button
        onClick={enviarPedidoWhatsApp}
        className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white hover:from-[#128C7E] hover:to-[#0a6b5e] border-none rounded-full font-extrabold text-base cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 active:translate-y-0.5 hover:-translate-y-0.5 transition-all duration-300 select-none"
      >
        <span>Enviar Pedido por WhatsApp</span>
      </button>

      <button
        onClick={limpiarFormularioManual}
        className="w-full mt-3.5 py-3 border border-stone-200 hover:border-red-500/25 hover:bg-red-50/40 text-stone-500 hover:text-red-600 rounded-full font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 select-none active:scale-[0.99]"
      >
        <Trash2 className="w-4 h-4 shrink-0 transition-transform" />
        <span>Limpiar Todo el Formulario</span>
      </button>
    </div>
  );
}
