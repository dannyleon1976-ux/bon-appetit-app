export interface Product {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export interface Client {
  id: string;
  cliente: string;
  rifCedula: string;
  direccion: string;
  telefonos: string;
  contacto: string;
}

export interface CartItem {
  nombre: string;
  cantidad: number;
  precio: number;
  categoria: string;
}

export type Cart = Record<string, CartItem>;

export interface HistoryOrder {
  id: string;
  fecha: string;
  cliente: string;
  total: number;
  items: {
    nombre: string;
    cantidad: number;
    precio: number;
    categoria: string;
  }[];
}
