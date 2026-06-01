import { useEffect, useState } from "react";
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
  productos: `${API_URL}/productos/productos/`,
  productoById: (pk: number) => `${API_URL}/productos/productos/${pk}/`,
  carrito: `${API_URL}/ventas/carrito/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useHomePage = () => {

  // Productos originales
  const [productosOriginales, setProductosOriginales] = useState<ProductoCard[]>([]);

  // Productos filtrados
  const [productos, setProductos] = useState<ProductoCard[]>([]);

  const [cargando, setCargando] = useState(false);

  // ── Filtros ─────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState("");
  const [minPrecio, setMinPrecio] = useState("");
  const [maxPrecio, setMaxPrecio] = useState("");

  // ── Cargar productos ──────────────────────

  const cargarProductos = async () => {

    try {

      setCargando(true);

      const res = await api.get(
        ENDPOINTS.productos,
        authCfg()
      );

      const data = res.data?.data ?? [];

      setProductosOriginales(data);
      setProductos(data);

    } catch (error: any) {

      if (
        error?.response?.status !== 401 &&
        error?.response?.status !== 403
      ) {
        Alerts.error("Error al cargar los productos");
      }

    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarProductos();
  }, []);
  // ──   Agregar Productos al Carrito ──────────────────────
  const agregarCarrito = async (pk: number)=> {
     try {
        await api.post(
          ENDPOINTS.carrito,
          { fk_producto: pk, cantidad_producto: 1 },
          authCfg()
        );
        Alerts.success("Producto agregado al carrito");
      } catch (error: any) {
        if (error?.response?.status === 404) {
          Alerts.error("Producto no encontrado");
        } else if (error?.response?.status !== 401) {
          Alerts.error("Error al agregar al carrito");
        }
      }
  }

  // ── Filtrar productos en FRONTEND ──────────────────────

  useEffect(() => {

    let filtrados = [...productosOriginales];

    // ── Buscar por texto ───────────────────────────────

    if (searchTerm.trim()) {

      const texto = searchTerm.toLowerCase();

      filtrados = filtrados.filter((p) =>
        p.nombre?.toLowerCase().includes(texto) ||
        p.codigo_producto?.toLowerCase().includes(texto)
      );
    }

    // ── Precio mínimo ──────────────────────────────────

    if (minPrecio.trim()) {

      filtrados = filtrados.filter(
        (p) => Number(p.precio) >= Number(minPrecio)
      );
    }

    // ── Precio máximo ──────────────────────────────────

    if (maxPrecio.trim()) {

      filtrados = filtrados.filter(
        (p) => Number(p.precio) <= Number(maxPrecio)
      );
    }

    setProductos(filtrados);

  }, [
    searchTerm,
    minPrecio,
    maxPrecio,
    productosOriginales
  ]);

  // ── Limpiar filtros ────────────────────────────────────

  const limpiarFiltros = () => {
    setSearchTerm("");
    setMinPrecio("");
    setMaxPrecio("");
  };

  // ── Detalle producto ───────────────────────────────────

  const cargarDetalleProducto = async (pk: number): Promise<ProductoDetalle | null> => {

    try {

      const res = await api.get(
        ENDPOINTS.productoById(pk),
        authCfg()
      );

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

  // ── Helpers ────────────────────────────────────────────

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

  const hayFiltrosActivos = !!(
    searchTerm ||
    minPrecio ||
    maxPrecio
  );

  return {
    productos,
    cargando,
    searchTerm,
    setSearchTerm,
    minPrecio,
    setMinPrecio,
    maxPrecio,
    setMaxPrecio,
    hayFiltrosActivos,
    limpiarFiltros,
    cargarDetalleProducto,
    agregarCarrito,
    formatPrecio,
    formatFecha,
  };
};