import { useEffect, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export const LogicaVentas = () => {
  const [ventasOriginales, setVentasOriginales] = useState<Venta[]>([]);
  const [ventas, setVentas]                     = useState<Venta[]>([]);
  const [cargando, setCargando]                 = useState(false);
  const [estados, setEstados]                   = useState<EstadoOption[]>([]);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]   = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha]   = useState("");

  // ── Estado inline editable ───────────────────────────────────────────────────
  const [editandoPk, setEditandoPk]     = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado]   = useState<string>("");
  const [guardandoPk, setGuardandoPk]   = useState<number | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────

  const cargarEstados = async () => {
    try {
      const res = await api.get(ENDPOINTS.estados, authCfg());
      setEstados(res.data ?? []);
    } catch {
    }
  };

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

  const iniciarEdicion = (venta: Venta) => {
    setEditandoPk(venta.pk_venta);
    setNuevoEstado(String(venta.fk_estado));
  };

  const cancelarEdicion = () => {
    setEditandoPk(null);
    setNuevoEstado("");
  };

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

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroEstado("");
    setFiltroFecha("");
  };

  // ── Helpers de formato ───────────────────────────────────────────────────────

  const formatPrecio = (valor: string | number) =>
    new Intl.NumberFormat("es-CO", {
      style:                 "currency",
      currency:              "COP",
      maximumFractionDigits: 0,
    }).format(Number(valor));

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    });

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
