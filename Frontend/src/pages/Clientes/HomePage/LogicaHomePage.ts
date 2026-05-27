import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductoCard {
  pk_producto: number;
  nombre: string;
  precio: number;
  fecha_publicacion: string;
  estado: string;
  codigo_producto: string;
  imagen_url: string | null;
}

export interface ProductoDetalle extends ProductoCard {
  detalles: string | null;
  nombre_vendedor: string | null;
  telefono_vendedor: string | null;
  correo_vendedor: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  productos:    `${API_URL}/productos/productos/`,
  productoById: (pk: number) => `${API_URL}/productos/productos/${pk}/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useHomePage = () => {
  const [productos, setProductos]         = useState<ProductoCard[]>([]);
  const [cargando, setCargando]           = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm]       = useState("");
  const [minPrecio, setMinPrecio]         = useState("");
  const [maxPrecio, setMaxPrecio]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce para el campo de texto
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Carga de productos ────────────────────────────────────────────────────

  const cargarProductos = useCallback(async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append("search",     debouncedSearch.trim());
      if (minPrecio.trim())       params.append("min_precio", minPrecio.trim());
      if (maxPrecio.trim())       params.append("max_precio", maxPrecio.trim());

      const res = await api.get(`${ENDPOINTS.productos}?${params}`, authCfg());
      setProductos(res.data?.data ?? []);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar los productos");
      }
    } finally {
      setCargando(false);
    }
  }, [debouncedSearch, minPrecio, maxPrecio]);

  useEffect(() => { void cargarProductos(); }, [cargarProductos]);

  // Aplicar filtros de precio (se llama al presionar Enter o al blur del input)
  const aplicarFiltrosPrecio = () => void cargarProductos();

  const limpiarFiltros = () => {
    setSearchTerm("");
    setMinPrecio("");
    setMaxPrecio("");
  };

  // ── Detalle de producto (se carga en la página de detalle) ────────────────

  const cargarDetalleProducto = async (pk: number): Promise<ProductoDetalle | null> => {
    try {
      const res = await api.get(ENDPOINTS.productoById(pk), authCfg());
      return res.data?.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        Alerts.error("Producto no encontrado");
      } else if (error?.response?.status !== 401) {
        Alerts.error("Error al cargar el producto");
      }
      return null;
    }
  };

  // ── Formato ───────────────────────────────────────────────────────────────

  const formatPrecio = (precio: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(precio);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const hayFiltrosActivos = !!(debouncedSearch || minPrecio || maxPrecio);

  return {
    // estado
    productos,
    cargando,
    // filtros
    searchTerm,
    setSearchTerm,
    minPrecio,
    setMinPrecio,
    maxPrecio,
    setMaxPrecio,
    hayFiltrosActivos,
    // acciones
    aplicarFiltrosPrecio,
    limpiarFiltros,
    cargarDetalleProducto,
    // helpers
    formatPrecio,
    formatFecha,
  };
};