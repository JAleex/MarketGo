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
      const data = await obtenerPermisosRol();
      setPermisos(data);
      setPermisosOriginales(data);
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
    <div className="container mt-4">
      <h2>Gestión de Permisos por Rol</h2>

      <div className="mb-3 d-flex gap-2">
        <button
          className="btn btn-success"
          onClick={guardarCambios}
          disabled={!hayCambios || guardando}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={resetCambios}
          disabled={!hayCambios}
        >
          Cancelar cambios
        </button>
      </div>

      {Object.entries(permisosPorRol).map(([rol, lista]) => (
        <div key={rol} className="mb-4">
          <h4 className="mt-3">{rol}</h4>

          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Vista</th>
                <th>Ruta</th>
                <th className="text-center">Acceso</th>
              </tr>
            </thead>

            <tbody>
              {lista.map((permiso) => (
                <tr key={permiso.pk_permiso_rol}>
                  <td>{permiso.nombre_vista}</td>
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
};

export default PermisosAdmin;