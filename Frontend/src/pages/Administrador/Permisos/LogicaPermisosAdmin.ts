import { useMemo, useState } from "react";
import api from "../../../api";
import shared from "../../../styles/Shared/shared.module.css";

export interface Vista {
  pk_permiso_rol: number;
  fk_rol: number;
  nombre_rol: string;
  fk_vista: number;
  icono: string;
  nombre_vista: string;
  ruta_vista: string;
  tiene_acceso: boolean;
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

type CambiosPendientes = {
  roles: Map<number, boolean>;
};

type Estado = "Activo" | "Inactivo";


const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  vistas: `${API_URL}/usuarios/vistas/`,
  rolesPermisos: `${API_URL}/usuarios/roles-permisos/`,
  permisosRol: `${API_URL}/usuarios/permisos-rol/`,
  permisosRolActualizar: `${API_URL}/usuarios/permisos-rol/actualizar/`,
  usuarios: `${API_URL}/usuarios/usuarios/`,
} as const;

const getAuthConfig = () => ({ withCredentials: true });

const ROL_ADMINISTRADOR_PK = 1;
const VISTA_POLITICAS_ACCESO_PK = 1;


export const LogicaPermisosAdmin = () => {
  const [vistas, setVistas] = useState<Vista[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [vistaSeleccionada, setVistaSeleccionada] = useState<Vista | null>(null);
  const [permisosRolVista, setPermisosRolVista] = useState<PermisoRol[]>([]);
  const [cambiosPendientes, setCambiosPendientes] = useState<CambiosPendientes>({roles: new Map(),});
  const [cargando, setCargando] = useState(false);


  const hayCambiosPendientes = useMemo(() => {
    return cambiosPendientes.roles.size > 0;
  }, [cambiosPendientes]);

  const estadoClasses: Record<Estado, string> = {
    Activo: shared.estadoActivo,
    Inactivo: shared.estadoInactivo,
  };

}

export const obtenerPermisosRol = async (): Promise<Vista[]> => {
  const response = await api.get("/usuarios/permisos-rol/");
  return response.data.data;
};

export const actualizarPermisosMasivo = async (permisos: Vista[]) => {
  const response = await api.post("/usuarios/permisos-rol/bulk/", permisos);
  return response.data;
};