import React, { useEffect, useMemo, useState } from "react";
import {
  obtenerPermisosRol,
  actualizarPermisosMasivo,
} from "./LogicaPermisosAdmin";
import shared from "../../../styles/Shared/shared.module.css";
import type { PermisoRol } from "./LogicaPermisosAdmin";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { FaPlus, FaPencilAlt, FaToggleOn, FaToggleOff, FaEye, FaCog, FaCheck, FaTimes } from "react-icons/fa";

const PermisosAdmin: React.FC = () => {

return (
  <>
    <PantallaCarga isLoading={cargando} />
     <div className="row">
          <div className="col-14" style={{backgroundColor: 'white', borderRadius: '8px'}}>
              <h1 className={shared.tituloSeccion}>
                VISTAS DEL SISTEMA
              </h1>
          </div>
      </div>
      <div className="table-container">
          <div className="title-container">
            <h2 className="custom-title">Vistas del Sistema</h2>
          </div>

          <div className="mod-grid-modulos">
            {permisoRol.length > 0 ? (
              vistasFiltradas.map((vista: Vista) => {
                const estadoNombre = vista.fk_estado === 1 ? "Activo" : "Inactivo";
                const vistaProtegida = esVistaProtegida(vista);
                const puedeDesactivar = !vistaProtegida || vista.fk_estado !== 1;
                
                return (
                  <div className="mod-card" key={vista.pk_vista}>
                    <div className="contenido-texto">
                      <h3>
                        {vista.icono && <i className={`bi ${vista.icono} me-2`}></i>}
                        {vista.nombre}
                        {vistaProtegida && <i className="bi bi-lock-fill ms-2 text-warning" title="Vista protegida del sistema"></i>}
                      </h3>

                      <div className="info-basica">
                        <p><strong>Ruta:</strong> <code>{vista.ruta}</code></p>
                        <p><strong>Estado:</strong> <span className={`${shared.evCleanStateText} ${estadoClasses[estadoNombre]}`}>{estadoNombre}</span></p>
                        {vista.vista_padre_nombre && <p><strong>Vista Padre:</strong> {vista.vista_padre_nombre}</p>}
                        <p>
                          <strong>Menú:</strong>{" "}
                          {vista.visible_en_navbar !== false ? (
                            <span className="text-success"><i className="bi bi-eye-fill me-1"></i>Visible</span>
                          ) : (
                            <span className="text-muted"><i className="bi bi-eye-slash-fill me-1"></i>Oculta</span>
                          )}
                        </p>
                      </div>

                      {vista.descripcion && <p className="descripcion-corta">{vista.descripcion}</p>}
                    </div>

                    <div className="mod-acciones">
                      <button className="btn mod-ver-detalle" onClick={() => { setVistaEditando(vista); setIsModalVistaOpen(true); }} title="Editar" type="button">
                        <FaPencilAlt className="icon edit-icon" />
                      </button>
                      <button className="btn mod-editar" onClick={() => handleVerDetallesVista(vista)} title="Ver detalles" type="button">
                        <FaEye className="icon view-icon" />
                      </button>
                      <button className="btn mod-gestionar-usuarios" onClick={() => handleAbrirGestionUsuarios(vista)} title="Gestionar permisos de usuarios" type="button">
                        <FaCog className="icon settings-icon" />
                      </button>
                      <button
                        className={`btn mod-toggle-estado ${vista.fk_estado === 1 ? "activo" : "inactivo"} ${!puedeDesactivar ? "protegido" : ""}`}
                        onClick={() => handleCambiarEstadoVista(vista)}
                        title={!puedeDesactivar ? "Esta vista está protegida y no puede ser desactivada" : vista.fk_estado === 1 ? "Desactivar" : "Activar"}
                        type="button"
                        disabled={!puedeDesactivar}
                      >
                        {!puedeDesactivar && <i className="bi bi-lock-fill me-1"></i>}
                        {vista.fk_estado === 1 ? <FaToggleOn className="icon toggle-on" /> : <FaToggleOff className="icon toggle-off" />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-resultados">
                <p>No se encontraron vistas con los criterios de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      
    </>
);
}
export default PermisosAdmin;