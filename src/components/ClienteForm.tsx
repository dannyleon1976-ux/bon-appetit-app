import React, { useState, useRef, useEffect } from "react";
import { User, Phone, MapPin, UserCheck, Truck, ClipboardList } from "lucide-react";
import { Client } from "../types";

interface ClienteFormProps {
  nombre: string;
  setNombre: (val: string) => void;
  telefono: string;
  setTelefono: (val: string) => void;
  direccion: string;
  setDireccion: (val: string) => void;
  contacto: string;
  setContacto: (val: string) => void;
  entrega: string;
  setEntrega: (val: string) => void;
  observaciones: string;
  setObservaciones: (val: string) => void;
  clientesList: Client[];
}

export default function ClienteForm({
  nombre,
  setNombre,
  telefono,
  setTelefono,
  direccion,
  setDireccion,
  contacto,
  setContacto,
  entrega,
  setEntrega,
  observaciones,
  setObservaciones,
  clientesList,
}: ClienteFormProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [coincidencias, setCoincidencias] = useState<Client[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalizer function to aid matching names (handling accents & casing)
  const normalizarTexto = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Handle client input search on names & phone numbers
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNombre(val);

    const busqueda = normalizarTexto(val);
    if (busqueda.length < 2) {
      setCoincidencias([]);
      setShowDropdown(false);
      return;
    }

    const matches = clientesList.filter((c) =>
      normalizarTexto(c.cliente).includes(busqueda) ||
      (c.telefonos && normalizarTexto(c.telefonos).includes(busqueda))
    ).slice(0, 8);

    setCoincidencias(matches);
    setShowDropdown(matches.length > 0);
  };

  // Select a suggestion and automatically autofill all relevant fields
  const handleSelectClient = (client: Client) => {
    setNombre(client.cliente);
    setTelefono(client.telefonos || "");
    setDireccion(client.direccion || "");
    setContacto(client.contacto || "");
    setShowDropdown(false);
  };

  // Close suggestions if user clicks outside of the bounds
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#fff8eb] to-[#fff8f0] p-6 rounded-3xl border border-amber-500/15 mb-6 shadow-xs transition-all duration-300 hover:border-amber-500/30 hover:shadow-md">
      
      {/* Name with Suggestion Box */}
      <div className="relative mb-4" ref={dropdownRef}>
        <label className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
          <User className="w-3.5 h-3.5 text-amber-600" />
          Cliente / Negocio
        </label>
        <input
          id="txtNombre"
          type="text"
          value={nombre}
          onChange={handleNombreChange}
          placeholder="Escribe el nombre del cliente..."
          autoComplete="off"
          className="w-full px-4 py-3 border-[1.5px] border-amber-800/20 focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 outline-none"
        />

        {showDropdown && (
          <div className="absolute top-[100%] left-0 right-0 bg-white border border-amber-800/20 rounded-xl overflow-hidden max-h-60 overflow-y-auto z-50 shadow-xl mt-1.5 animate-fade-in divide-y divide-amber-500/5">
            {coincidencias.map((c) => (
              <div
                key={c.id || c.cliente}
                onClick={() => handleSelectClient(c)}
                className="p-3 cursor-pointer hover:bg-amber-100/50 transition-colors"
                id={`suggestion-${c.id}`}
              >
                <div className="font-extrabold text-xs text-[#3e2723]">
                  🏢 {c.cliente}
                </div>
                <div className="text-[10px] text-amber-700 font-medium mt-1">
                  📞 {c.telefonos}
                </div>
                {c.direccion && (
                  <div className="text-[9px] text-[#9e8a7a] mt-0.5 line-clamp-1">
                    📍 {c.direccion}
                  </div>
                )}
                {c.contacto && (
                  <div className="text-[9px] text-amber-800/80 mt-0.5 font-semibold">
                    👤 {c.contacto}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two column Grid - Phone & Address */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            Teléfono / WhatsApp
          </label>
          <input
            id="txtTelefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. 04125555555"
            className="w-full px-3.5 py-3 border-[1.5px] border-amber-800/20 focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 outline-none"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            Dirección
          </label>
          <input
            id="txtDireccion"
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección..."
            className="w-full px-3.5 py-3 border-[1.5px] border-amber-800/20 focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 outline-none"
          />
        </div>
      </div>

      {/* Two column Grid - Contact Person & Handling Delivery Type */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            Contacto
          </label>
          <input
            id="txtContacto"
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="Nombre de contacto..."
            className="w-full px-3.5 py-3 border-[1.5px] border-[#d2b48c] focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 outline-none"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            Tipo de Entrega
          </label>
          <select
            id="selEntrega"
            value={entrega}
            onChange={(e) => setEntrega(e.target.value)}
            className="w-full px-3 py-3 border-[1.5px] border-[#d2b48c] focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] appearance-none cursor-pointer transition-all focus:ring-3 focus:ring-amber-500/10 outline-none"
          >
            <option value="Delivery">Delivery 🛵</option>
            <option value="Retiro en tienda">Retiro en Tienda 🏪</option>
          </select>
        </div>
      </div>

      {/* Notes / Special Observations */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#3e2723] tracking-wide mb-2">
          <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
          Observaciones / Notas
        </label>
        <textarea
          id="txtObservaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          placeholder="Ej: Entregar después de 3pm, llamar antes de llegar..."
          className="w-full px-3.5 py-3 border-[1.5px] border-[#d2b48c] focus:border-amber-500 rounded-xl text-sm bg-white text-[#3e2723] transition-all focus:ring-3 focus:ring-amber-500/10 outline-none resize-none"
        />
      </div>

    </div>
  );
}
