import api from "../../../api";

export interface PermisoRol {
  pk_permiso_rol: number;
  fk_rol: number;
  nombre_rol: string;
  fk_vista: number;
  nombre_vista: string;
  ruta_vista: string;
  tiene_acceso: boolean;
}

export const obtenerPermisosRol = async (): Promise<PermisoRol[]> => {
  const response = await api.get("/usuarios/permisos-rol/");
  return response.data;
};

export const actualizarPermisosMasivo = async (permisos: PermisoRol[]) => {
  const response = await api.post("/usuarios/permisos-rol/bulk/", permisos);
  return response.data;
};