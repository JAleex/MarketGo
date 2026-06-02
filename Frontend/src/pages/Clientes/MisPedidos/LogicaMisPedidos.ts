import { useEffect, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Representa un pedido realizado por el comprador autenticado. */
export interface Pedido {
  pk_pedido:          number;
  cantidad_productos: number;
  fecha_pedido:       string;
  total_pedido:       string;
  fk_estado:          number;
  estado_nombre:      string;
}

/** Ítem de detalle dentro de un pedido (un producto específico). */
export interface DetallePedido {
  pk_detalle_pedido: number;
  pk_producto:       number;
  producto_nombre:   string;
  producto_precio:   string;
  imagen_url:        string | null;
  cantidad_producto: number;
  total_pedido:      string;
  estado_nombre:     string;
}

/** Opción de estado para el filtro desplegable. */
export interface EstadoOption {
  pk_estado: number;
  nombre:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  misPedidos: `${API_URL}/ventas/mis-pedidos/`,
  detalle:    (pk: number) => `${API_URL}/ventas/mis-pedidos/${pk}/detalle/`,
  estados:    `${API_URL}/usuarios/estados/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de lógica para el módulo Mis Pedidos.
 *
 * Responsabilidades:
 * - Cargar la lista de pedidos con filtros **servidor** (estado, fecha).
 * - Aplicar búsqueda libre **cliente** sobre los resultados (pk, nombre de estado).
 * - Mostrar el detalle de un pedido en un modal con sus `DetallePedidos`.
 *
 * @returns Estado reactivo y handlers para el componente `MisPedidos.tsx`.
 */
export const LogicaMisPedidos = () => {
  /** Copia original sin filtrar; sirve como fuente para la búsqueda cliente. */
  const [pedidosOriginales, setPedidosOriginales] = useState<Pedido[]>([]);
  /** Lista visible (después de aplicar `searchTerm` sobre `pedidosOriginales`). */
  const [pedidos, setPedidos]                     = useState<Pedido[]>([]);
  const [cargando, setCargando]                   = useState(false);
  const [estados, setEstados]                     = useState<EstadoOption[]>([]);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha]   = useState("");

  // ── Modal detalle ────────────────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto]       = useState(false);
  const [pedidoSeleccionado, setPedidoSel]    = useState<Pedido | null>(null);
  const [detalles, setDetalles]               = useState<DetallePedido[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // ── Carga de estados ─────────────────────────────────────────────────────────

  /**
   * Carga todos los estados disponibles desde el servidor.
   * Se ejecuta una sola vez al montar el hook.
   */
  const cargarEstados = async () => {
    try {
      const res = await api.get(ENDPOINTS.estados, authCfg());
      setEstados(res.data ?? []);
    } catch {
    }
  };

  // ── Carga de pedidos (con filtros servidor) ──────────────────────────────────

  /**
   * Carga los pedidos del comprador autenticado aplicando los filtros servidor.
   * Se re-ejecuta cada vez que cambian `filtroEstado` o `filtroFecha`.
   */
  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFecha)  params.fecha  = filtroFecha;

      const res = await api.get(ENDPOINTS.misPedidos, { ...authCfg(), params });
      const data: Pedido[] = res.data?.data ?? [];
      setPedidosOriginales(data);
      setPedidos(data);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar los pedidos");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarEstados(); }, []);
  useEffect(() => { void cargarPedidos(); }, [filtroEstado, filtroFecha]);

  // ── Búsqueda cliente ─────────────────────────────────────────────────────────

  /**
   * Filtra `pedidosOriginales` por el texto libre introducido en `searchTerm`.
   * Compara contra: pk del pedido y nombre del estado.
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setPedidos(pedidosOriginales);
      return;
    }
    const texto = searchTerm.toLowerCase();
    setPedidos(
      pedidosOriginales.filter(
        (p) =>
          String(p.pk_pedido).includes(texto) ||
          p.estado_nombre.toLowerCase().includes(texto)
      )
    );
  }, [searchTerm, pedidosOriginales]);

  // ── Limpiar filtros ──────────────────────────────────────────────────────────

  /** Restablece los tres filtros (búsqueda, estado y fecha) a su valor inicial. */
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("");
    setFiltroFecha("");
  };

  /** `true` cuando al menos uno de los tres filtros tiene valor. */
  const hayFiltrosActivos = !!(searchTerm || filtroEstado || filtroFecha);

  // ── Abrir modal con detalle ──────────────────────────────────────────────────

  /**
   * Abre el modal de detalle y carga los `DetallePedidos` del pedido seleccionado.
   * El modal se muestra inmediatamente con spinner mientras llega la respuesta.
   * @param pedido - Pedido del cual se quiere ver el detalle.
   */
  const abrirDetalle = async (pedido: Pedido) => {
    setPedidoSel(pedido);
    setDetalles([]);
    setModalAbierto(true);
    try {
      setCargandoDetalle(true);
      const res = await api.get(ENDPOINTS.detalle(pedido.pk_pedido), authCfg());
      setDetalles(res.data?.data ?? []);
    } catch {
      Alerts.error("Error al cargar el detalle del pedido");
    } finally {
      setCargandoDetalle(false);
    }
  };

  /** Cierra el modal y limpia el estado del detalle. */
  const cerrarModal = () => {
    setModalAbierto(false);
    setPedidoSel(null);
    setDetalles([]);
  };

  // ── Helpers de formato ───────────────────────────────────────────────────────

  /**
   * Formatea un valor numérico como moneda COP sin decimales.
   * @param valor - Precio en string o número.
   * @returns Cadena formateada, p. ej. `"$ 12.000"`.
   */
  const formatPrecio = (valor: string | number) =>
    new Intl.NumberFormat("es-CO", {
      style:                 "currency",
      currency:              "COP",
      maximumFractionDigits: 0,
    }).format(Number(valor));

  /**
   * Convierte una fecha ISO a formato local `DD/MM/AAAA`.
   * @param fecha - String de fecha en formato ISO 8601.
   * @returns Fecha formateada en `es-CO`.
   */
  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    });

  return {
    pedidos,
    cargando,
    estados,
    // filtros
    searchTerm,    setSearchTerm,
    filtroEstado,  setFiltroEstado,
    filtroFecha,   setFiltroFecha,
    hayFiltrosActivos,
    limpiarFiltros,
    // modal detalle
    modalAbierto,
    pedidoSeleccionado,
    detalles,
    cargandoDetalle,
    abrirDetalle,
    cerrarModal,
    // helpers
    formatPrecio,
    formatFecha,
  };
};
