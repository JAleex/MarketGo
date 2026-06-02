import { useEffect, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Representa una venta realizada por el vendedor autenticado. */
export interface Venta {
  pk_venta:          number;
  pk_producto:       number;
  cantidad_producto: number;
  fecha:             string;
  comprador_nombre:  string | null;
  comprador_correo:  string | null;
  total_venta:       string;
  fk_estado:         number;
  estado_nombre:     string;
}

/** Opción de estado para los filtros y el selector inline. */
export interface EstadoOption {
  pk_estado: number;
  nombre:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  misVentas:      `${API_URL}/ventas/mis-ventas/`,
  cambiarEstado:  (pk: number) => `${API_URL}/ventas/mis-ventas/${pk}/estado/`,
  estados:        `${API_URL}/usuarios/estados/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de lógica para el módulo Mis Ventas.
 *
 * Responsabilidades:
 * - Cargar la lista de ventas con filtros **servidor** (estado, fecha).
 * - Aplicar búsqueda libre **cliente** sobre los resultados (pk, comprador, estado).
 * - Gestionar la edición inline del estado de una venta individual.
 * - Cuando se guarda un nuevo estado, propagar el cambio al `DetallePedidos` y
 *   `Pedidos` correspondientes (lógica ejecutada en el backend).
 *
 * @returns Estado reactivo y handlers para el componente `Ventas.tsx`.
 */
export const LogicaVentas = () => {
  /** Copia original sin filtrar; sirve como fuente para la búsqueda cliente. */
  const [ventasOriginales, setVentasOriginales] = useState<Venta[]>([]);
  /** Lista visible (después de aplicar `searchTerm` sobre `ventasOriginales`). */
  const [ventas, setVentas]                     = useState<Venta[]>([]);
  const [cargando, setCargando]                 = useState(false);
  const [estados, setEstados]                   = useState<EstadoOption[]>([]);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha]   = useState("");

  // ── Estado inline editable ───────────────────────────────────────────────────
  /** pk de la venta cuyo select de estado está abierto, o `null` si ninguno. */
  const [editandoPk, setEditandoPk]   = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  /** pk de la venta que se está guardando (muestra spinner inline). */
  const [guardandoPk, setGuardandoPk] = useState<number | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────

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

  /**
   * Carga las ventas del vendedor autenticado aplicando los filtros servidor.
   * Se re-ejecuta cada vez que cambian `filtroEstado` o `filtroFecha`.
   */
  const cargarVentas = async () => {
    try {
      setCargando(true);
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFecha)  params.fecha  = filtroFecha;

      const res = await api.get(ENDPOINTS.misVentas, { ...authCfg(), params });
      const data: Venta[] = res.data?.data ?? [];
      setVentasOriginales(data);
      setVentas(data);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar las ventas");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarEstados(); }, []);
  useEffect(() => { void cargarVentas(); }, [filtroEstado, filtroFecha]);

  // ── Filtro de búsqueda en frontend ───────────────────────────────────────────

  /**
   * Filtra `ventasOriginales` por el texto libre introducido en `searchTerm`.
   * Compara contra: pk, nombre del comprador, correo del comprador y nombre del estado.
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setVentas(ventasOriginales);
      return;
    }
    const texto = searchTerm.toLowerCase();
    setVentas(
      ventasOriginales.filter(
        (v) =>
          String(v.pk_venta).includes(texto) ||
          (v.comprador_nombre?.toLowerCase().includes(texto)) ||
          (v.comprador_correo?.toLowerCase().includes(texto)) ||
          v.estado_nombre.toLowerCase().includes(texto)
      )
    );
  }, [searchTerm, ventasOriginales]);

  // ── Cambiar estado inline ────────────────────────────────────────────────────

  /**
   * Activa el selector de estado inline para una venta específica.
   * Pre-carga el select con el estado actual de la venta.
   * @param venta - Venta sobre la cual se va a editar el estado.
   */
  const iniciarEdicion = (venta: Venta) => {
    setEditandoPk(venta.pk_venta);
    setNuevoEstado(String(venta.fk_estado));
  };

  /** Cancela la edición inline sin guardar cambios. */
  const cancelarEdicion = () => {
    setEditandoPk(null);
    setNuevoEstado("");
  };

  /**
   * Envía el nuevo estado al backend (PATCH) y actualiza la lista local.
   * El backend propaga el cambio a `DetallePedidos` y al `Pedido` padre
   * si todos sus detalles quedan en el mismo estado.
   * @param pk - pk_venta de la venta a actualizar.
   */
  const guardarEstado = async (pk: number) => {
    if (!nuevoEstado) return;
    try {
      setGuardandoPk(pk);
      const res = await api.patch(
        ENDPOINTS.cambiarEstado(pk),
        { fk_estado: Number(nuevoEstado) },
        authCfg()
      );
      const actualizada: Venta = res.data?.data;
      setVentasOriginales((prev) =>
        prev.map((v) => (v.pk_venta === pk ? actualizada : v))
      );
      setEditandoPk(null);
      setNuevoEstado("");
      Alerts.success("Estado actualizado");
    } catch {
      Alerts.error("Error al actualizar el estado");
    } finally {
      setGuardandoPk(null);
    }
  };

  // ── Limpiar filtros ──────────────────────────────────────────────────────────

  /** Restablece los tres filtros (búsqueda, estado y fecha) a su valor inicial. */
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("");
    setFiltroFecha("");
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

  /** `true` cuando al menos uno de los tres filtros tiene valor. */
  const hayFiltrosActivos = !!(searchTerm || filtroEstado || filtroFecha);

  return {
    ventas,
    cargando,
    estados,
    // filtros
    searchTerm,    setSearchTerm,
    filtroEstado,  setFiltroEstado,
    filtroFecha,   setFiltroFecha,
    hayFiltrosActivos,
    limpiarFiltros,
    // edición de estado
    editandoPk,
    nuevoEstado,   setNuevoEstado,
    guardandoPk,
    iniciarEdicion,
    cancelarEdicion,
    guardarEstado,
    // helpers
    formatPrecio,
    formatFecha,
  };
};
