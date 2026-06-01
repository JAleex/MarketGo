import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CarritoItem {
  pk_carrito:        number;
  fk_producto:       number;
  producto_nombre:   string;
  producto_precio:   number;
  vendedor_nombre:   string;
  imagen_url:        string | null;
  cantidad_producto: number;
  subtotal:          number;
  fecha:             string;
}

export interface ResumenCarrito {
  items:            CarritoItem[];
  total_productos:  number;
  total_precio:     number;
}

// ─── Agrupación por vendedor (para el mockup) ─────────────────────────────────

export interface GrupoVendedor {
  vendedor: string;
  items:    CarritoItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  carrito:       `${API_URL}/ventas/carrito/`,
  carritoItem:   (pk: number) => `${API_URL}/ventas/carrito/${pk}/`,
  realizarPedido:`${API_URL}/ventas/realizar-pedido/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const LogicaCarrito = () => {
  const [resumen, setResumen]   = useState<ResumenCarrito>({ items: [], total_productos: 0, total_precio: 0 });
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // ── Carga ──────────────────────────────────────────────────────────────────

  const cargarCarrito = useCallback(async () => {
    try {
      setCargando(true);
      const res = await api.get(ENDPOINTS.carrito, authCfg());
      setResumen(res.data?.data ?? { items: [], total_productos: 0, total_precio: 0 });
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar el carrito");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarCarrito(); }, [cargarCarrito]);

  // ── Agregar producto ───────────────────────────────────────────────────────

  const agregarAlCarrito = async (fk_producto: number, cantidad = 1) => {
    try {
      const res = await api.post(
        ENDPOINTS.carrito,
        { fk_producto, cantidad_producto: cantidad },
        authCfg()
      );
      setResumen(res.data?.data);
      Alerts.success("Producto agregado al carrito");
    } catch (error: any) {
      Alerts.error(error?.response?.data?.message ?? "Error al agregar al carrito");
    }
  };

  // ── Actualizar cantidad ────────────────────────────────────────────────────

  const actualizarCantidad = async (pk_carrito: number, cantidad: number) => {
    if (cantidad < 1) {
      await eliminarItem(pk_carrito);
      return;
    }
    try {
      const res = await api.patch(
        ENDPOINTS.carritoItem(pk_carrito),
        { cantidad_producto: cantidad },
        authCfg()
      );
      setResumen(res.data?.data);
    } catch (error: any) {
      Alerts.error(error?.response?.data?.message ?? "Error al actualizar cantidad");
    }
  };

  // ── Eliminar ítem ──────────────────────────────────────────────────────────

  const eliminarItem = async (pk_carrito: number) => {
    try {
      const res = await api.delete(ENDPOINTS.carritoItem(pk_carrito), authCfg());
      setResumen(res.data?.data);
    } catch (error: any) {
      Alerts.error(error?.response?.data?.message ?? "Error al eliminar del carrito");
    }
  };

  // ── Realizar pedido ────────────────────────────────────────────────────────

  const realizarPedido = async () => {
    if (resumen.items.length === 0) return;

    const result = await Alerts.confirm(
      `Se realizará un pedido con ${resumen.total_productos} producto(s) por ${formatPrecio(resumen.total_precio)}`,
      {
        title: "¿Confirmar pedido?",
        confirmText: "Sí, realizar pedido",
        cancelText: "Cancelar",
      }
    );
    if (!result.isConfirmed) return;

    try {
      setProcesando(true);
      await api.post(ENDPOINTS.realizarPedido, {}, authCfg());
      setResumen({ items: [], total_productos: 0, total_precio: 0 });
      Alerts.success("¡Pedido realizado exitosamente!");
    } catch (error: any) {
      Alerts.error(error?.response?.data?.message ?? "Error al realizar el pedido");
    } finally {
      setProcesando(false);
    }
  };

  // ── Grupos por vendedor (para el layout del mockup) ───────────────────────

  const gruposPorVendedor: GrupoVendedor[] = resumen.items.reduce<GrupoVendedor[]>(
    (acc, item) => {
      const grupo = acc.find((g) => g.vendedor === item.vendedor_nombre);
      if (grupo) {
        grupo.items.push(item);
      } else {
        acc.push({ vendedor: item.vendedor_nombre, items: [item] });
      }
      return acc;
    },
    []
  );

  // ── Formato ────────────────────────────────────────────────────────────────

  const formatPrecio = (precio: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(precio);

  return {
    resumen,
    gruposPorVendedor,
    cargando,
    procesando,
    agregarAlCarrito,
    actualizarCantidad,
    eliminarItem,
    realizarPedido,
    formatPrecio,
  };
};