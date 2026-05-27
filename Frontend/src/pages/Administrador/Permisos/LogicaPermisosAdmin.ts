import { useEffect, useMemo, useState } from "react";
import { Alerts } from "../../../components/Alertas/alertas";
import api from "../../../api";
import shared from "../../../styles/Shared/shared.module.css";

export interface Vista {
  pk_vista: number;
  nombre: string;
  ruta: string;
  icono?: string | null;
  descripcion?: string | null;
  fk_estado: number;
  estado?: string;
  visible_en_navbar?: boolean;
}

export interface Rol {
  pk_rol: number;
  nombre_rol: string;
}

export interface PermisoRol {
  pk_permiso_rol?: number;
  fk_rol: number;
  fk_vista: number;
  tiene_acceso: boolean;
}

type Estado = "Activo" | "Inactivo";

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  vistas: `${API_URL}/usuarios/vistas/`,
  rolesPermisos: `${API_URL}/usuarios/roles-permisos/`,
  permisosRol: `${API_URL}/usuarios/permisos-rol/`,
  permisosRolActualizar: `${API_URL}/usuarios/permisos-rol/actualizar/`,
} as const;

const getAuthConfig = () => ({ withCredentials: true });

const ROL_ADMINISTRADOR_PK = 1;
const VISTA_POLITICAS_ACCESO_PK = 1;

export const LogicaPermisosAdmin = () => {
  const [vistas, setVistas] = useState<Vista[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [vistaSeleccionada, setVistaSeleccionada] = useState<Vista | null>(null);
  const [permisosRolVista, setPermisosRolVista] = useState<PermisoRol[]>([]);
  const [cambiosPendientes, setCambiosPendientes] = useState<Map<number, boolean>>(new Map());
  const [cargando, setCargando] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVistaOpen, setIsModalVistaOpen] = useState(false);
  const [vistaEditando, setVistaEditando] = useState<Vista | null>(null);
  const [vistaData, setVistaData] = useState<Partial<Vista>>({
    nombre: "",
    ruta: "",
    icono: "",
    descripcion: "",
    fk_estado: 1,
    visible_en_navbar: true,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const hayCambiosPendientes = useMemo(() => cambiosPendientes.size > 0, [cambiosPendientes]);

  const estadoClasses: Record<Estado, string> = {
    Activo: shared.estadoActivo,
    Inactivo: shared.estadoInactivo,
  };

  const esPermisoProtegido = (pkRol: number): boolean => {
    if (!vistaSeleccionada || vistaSeleccionada.pk_vista !== VISTA_POLITICAS_ACCESO_PK) return false;
    return pkRol === ROL_ADMINISTRADOR_PK;
  };

  const esVistaProtegida = (vista: Vista): boolean => {
    return vista.pk_vista === VISTA_POLITICAS_ACCESO_PK;
  };

  useEffect(() => {
    void obtenerVistas();
    void obtenerRoles();
  }, []);

  useEffect(() => {
    if (!vistaSeleccionada) return;
    void obtenerPermisosVista(vistaSeleccionada.pk_vista);
    setCambiosPendientes(new Map());
  }, [vistaSeleccionada]);

  useEffect(() => {
    if (!vistaEditando) return;
    setVistaData({
      nombre: vistaEditando.nombre,
      ruta: vistaEditando.ruta,
      icono: vistaEditando.icono ?? "",
      descripcion: vistaEditando.descripcion ?? "",
      fk_estado: vistaEditando.fk_estado,
      visible_en_navbar: vistaEditando.visible_en_navbar ?? true,
    });
  }, [vistaEditando]);

  const obtenerVistas = async () => {
    try {
      setCargando(true);
      const res = await api.get(ENDPOINTS.vistas, getAuthConfig());
      setVistas(res.data?.data || []);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al obtener las vistas");
      }
    } finally {
      setCargando(false);
    }
  };

  const obtenerRoles = async () => {
    try {
      const res = await api.get(ENDPOINTS.rolesPermisos, getAuthConfig());
      setRoles(res.data|| []);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al obtener los roles");
      }
    }
  };

  const obtenerPermisosVista = async (pkVista: number, mostrarCargando = true) => {
    try {
      if (mostrarCargando) setCargando(true);
      const res = await api.get(ENDPOINTS.permisosRol, getAuthConfig());
      const permisos = (res.data?.data || []).filter((p: PermisoRol) => p.fk_vista === pkVista);
      setPermisosRolVista(permisos);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al obtener los permisos de la vista");
      }
    } finally {
      if (mostrarCargando) setCargando(false);
    }
  };

  const handleTogglePermisoRol = (pkRol: number, tieneAcceso: boolean) => {
    if (esPermisoProtegido(pkRol) && !tieneAcceso) {
      Alerts.warning("No se puede denegar el acceso del rol Administrador a la vista de Políticas de Acceso");
      return;
    }
    setCambiosPendientes((prev) => {
      const next = new Map(prev);
      next.set(pkRol, tieneAcceso);
      return next;
    });
  };

  const descartarCambiosPermisos = () => setCambiosPendientes(new Map());

  const guardarCambiosPermisos = async () => {
    if (!vistaSeleccionada || !hayCambiosPendientes) return;
    setCargando(true);
    try {
      const pkVista = vistaSeleccionada.pk_vista;
      const promesas = Array.from(cambiosPendientes.entries()).map(([pkRol, tieneAcceso]) =>
        api.post(
          ENDPOINTS.permisosRolActualizar,
          { fk_rol: pkRol, fk_vista: pkVista, tiene_acceso: tieneAcceso },
          getAuthConfig()
        )
      );
      await Promise.all(promesas);
      await obtenerPermisosVista(pkVista, false);
      descartarCambiosPermisos();
      window.dispatchEvent(new CustomEvent("permisosActualizados"));
      Alerts.success("Permisos actualizados correctamente");
    } catch (error: any) {
      const mensajeError = error?.response?.data?.message || "Error al actualizar los permisos";
      Alerts.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const rolTieneAcceso = (pkRol: number): boolean => {
    if (cambiosPendientes.has(pkRol)) return cambiosPendientes.get(pkRol) ?? false;
    return permisosRolVista.find((p) => p.fk_rol === pkRol)?.tiene_acceso ?? false;
  };

  const validarCamposVista = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!vistaData.nombre?.trim()) {
      nuevosErrores.nombre = "Nombre es requerido";
    } else if (vistaData.nombre.trim().length < 3) {
      nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!vistaData.ruta?.trim()) {
      nuevosErrores.ruta = "Ruta es requerida";
    } else if (!vistaData.ruta.trim().startsWith("/")) {
      nuevosErrores.ruta = "La ruta debe comenzar con /";
    } else if (vistaData.ruta.trim().length < 2) {
      nuevosErrores.ruta = "La ruta debe tener al menos 2 caracteres";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const limpiarCamposVista = () => {
    setVistaEditando(null);
    setVistaData({ nombre: "", ruta: "", icono: "", descripcion: "", fk_estado: 1, visible_en_navbar: true });
    setErrores({});
  };

  const handleInputChangeVista = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let valorFinal: any = value;
    if (name === "fk_estado") valorFinal = Number(value);
    else if (name === "visible_en_navbar") valorFinal = value === "true" || value === true;
    setVistaData((prev) => ({ ...prev, [name]: valorFinal }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRegistrarVista = async () => {
    if (!validarCamposVista()) return;
    try {
      setCargando(true);
      await api.post(ENDPOINTS.vistas, vistaData, getAuthConfig());
      Alerts.success("Vista registrada correctamente");
      await obtenerVistas();
      setIsModalVistaOpen(false);
      limpiarCamposVista();
      window.dispatchEvent(new CustomEvent("permisosActualizados"));
    } catch (error: any) {
      if (error?.response?.data?.data) {
        const erroresBackend = error.response.data.data;
        setErrores(erroresBackend);
        Alerts.error(Object.values(erroresBackend)[0] as string);
      } else {
        Alerts.error(error?.response?.data?.message || "Error al registrar la vista");
      }
    } finally {
      setCargando(false);
    }
  };

  const handleEditarVista = async () => {
    if (!vistaEditando || !validarCamposVista()) return;
    try {
      setCargando(true);
      await api.patch(`${ENDPOINTS.vistas}${vistaEditando.pk_vista}/`, vistaData, getAuthConfig());
      Alerts.success("Vista actualizada correctamente");
      await obtenerVistas();
      setIsModalVistaOpen(false);
      limpiarCamposVista();
      window.dispatchEvent(new CustomEvent("permisosActualizados"));
    } catch (error: any) {
      if (error?.response?.data?.data) {
        const erroresBackend = error.response.data.data;
        setErrores(erroresBackend);
        Alerts.error(Object.values(erroresBackend)[0] as string);
      } else {
        Alerts.error(error?.response?.data?.message || "Error al actualizar la vista");
      }
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarEstadoVista = async (vista: Vista) => {
    if (esVistaProtegida(vista) && vista.fk_estado === 1) {
      Alerts.warning("No se puede desactivar la vista de Políticas de Acceso");
      return;
    }
    const nuevoEstado = vista.fk_estado === 1 ? 2 : 1;
    const textoAccion = vista.fk_estado === 1 ? "desactivar" : "activar";
    const result = await Alerts.confirm(`¿Está seguro de ${textoAccion} la vista "${vista.nombre}"?`, {
      title: `Confirmar ${textoAccion}`,
      confirmText: `Sí, ${textoAccion}`,
      cancelText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      setCargando(true);
      await api.patch(`${ENDPOINTS.vistas}${vista.pk_vista}/`, { fk_estado: nuevoEstado }, getAuthConfig());
      Alerts.success(`Vista ${textoAccion === "activar" ? "activada" : "desactivada"} correctamente`);
      await obtenerVistas();
      window.dispatchEvent(new CustomEvent("permisosActualizados"));
    } catch (error: any) {
      Alerts.error(error?.response?.data?.message || `Error al ${textoAccion} la vista`);
    } finally {
      setCargando(false);
    }
  };

  const handleVerDetallesVista = (vista: Vista) => {
    const estadoNombre = vista.fk_estado === 1 ? "Activo" : "Inactivo";
    const visibilidad = vista.visible_en_navbar !== false ? "Visible en menú" : "Oculta del menú";
    Alerts.detail({
      title: "Detalles de la Vista",
      rows: [
        { label: "Nombre", value: vista.nombre },
        { label: "Ruta", value: vista.ruta },
        { label: "Icono", value: vista.icono || "Sin icono", icon: vista.icono || undefined },
        { label: "Estado", value: estadoNombre },
        { label: "Visibilidad", value: visibilidad },
        ...(vista.descripcion ? [{ label: "Descripción", value: vista.descripcion, type: "long" as const }] : []),
      ],
      onCancel: () => {
        setVistaEditando(vista);
        setIsModalVistaOpen(true);
      },
    });
  };

  return {
    vistas,
    roles,
    vistaSeleccionada,
    setVistaSeleccionada,
    permisosRolVista,
    cargando,
    searchTerm,
    setSearchTerm,
    isModalVistaOpen,
    setIsModalVistaOpen,
    vistaEditando,
    setVistaEditando,
    vistaData,
    errores,
    handleRegistrarVista,
    handleEditarVista,
    handleCambiarEstadoVista,
    handleInputChangeVista,
    handleTogglePermisoRol,
    limpiarCamposVista,
    rolTieneAcceso,
    guardarCambiosPermisos,
    descartarCambiosPermisos,
    hayCambiosPendientes,
    esPermisoProtegido,
    esVistaProtegida,
    handleVerDetallesVista,
    estadoClasses,
    
  };
};