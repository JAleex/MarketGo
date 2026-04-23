import React, { useEffect, useMemo, useState } from "react";
import {
  obtenerPermisosRol,
  actualizarPermisosMasivo,
} from "./LogicaPermisosAdmin";

import type { PermisoRol } from "./LogicaPermisosAdmin";

const PermisosAdmin: React.FC = () => {
  const [permisos, setPermisos] = useState<PermisoRol[]>([]);
  const [permisosOriginales, setPermisosOriginales] = useState<PermisoRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPermisos();
  }, []);

const cargarPermisos = async () => {
  try {
    setLoading(true);

    const response = await obtenerPermisosRol();

    setPermisos(response);
    setPermisosOriginales(response);

  } catch (err) {
    console.error(err);
    setError("Error al cargar permisos");
  } finally {
    setLoading(false);
  }
};

  const permisosPorRol = useMemo(() => {
    const grouped: Record<string, PermisoRol[]> = {};

    permisos.forEach((permiso) => {
      if (!grouped[permiso.nombre_rol]) {
        grouped[permiso.nombre_rol] = [];
      }
      grouped[permiso.nombre_rol].push(permiso);
    });

    return grouped;
  }, [permisos]);

  const hayCambios = useMemo(() => {
    return JSON.stringify(permisos) !== JSON.stringify(permisosOriginales);
  }, [permisos, permisosOriginales]);

  const handleToggle = (pk: number) => {
    setPermisos((prev) =>
      prev.map((p) =>
        p.pk_permiso_rol === pk
          ? { ...p, tiene_acceso: !p.tiene_acceso }
          : p
      )
    );
  };

  const guardarCambios = async () => {
    try {
      setGuardando(true);
      await actualizarPermisosMasivo(permisos);
      setPermisosOriginales(permisos);
      alert("Permisos guardados correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al guardar permisos");
    } finally {
      setGuardando(false);
    }
  };

  const resetCambios = () => {
    setPermisos(permisosOriginales);
  };

  if (loading) return <p>Cargando permisos...</p>;
  if (error) return <p>{error}</p>;

return (
    <div className="mt-4">
      <h2 className="mb-4">Gestión de Permisos por Rol</h2>

      {Object.entries(permisosPorRol).map(([rol, lista]) => (
        <div key={rol} className="card mb-4 shadow-sm">
          <div className="card-header bg-dark text-white">
            <strong>{rol}</strong>
          </div>

          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Vista</th>
                <th>Ruta</th>
                <th className="text-center">Acceso</th>
              </tr>
            </thead>

            <tbody>
              {lista.map((permiso) => (
                <tr key={permiso.pk_permiso_rol}>
                  <td>
                    <i className={`bi ${permiso.icono || "bi-circle"} me-2`} />
                    {permiso.nombre_vista}
                  </td>

                  <td>{permiso.ruta_vista}</td>

                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={permiso.tiene_acceso}
                      onChange={() =>
                        handleToggle(permiso.pk_permiso_rol)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
);
}
export default PermisosAdmin;