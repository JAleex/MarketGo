import React, { useState, useMemo } from "react";
import { LogicaPermisosAdmin } from "./LogicaPermisosAdmin";
import Modal from "../../../components/Modales/Modal";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import "../../../styles/Shared/shared.css";
import "../../../styles/Administrador/PermisosAdmin.css";
import shared from "../../../styles/Shared/shared.module.css";
import { FaPlus, FaPencilAlt, FaToggleOn, FaToggleOff, FaEye, FaCog } from "react-icons/fa";
import Swal, { type SweetAlertResult } from "sweetalert2";

type Vista = {
  pk_vista: number;
  nombre: string;
  ruta: string;
  icono?: string | null;
  descripcion?: string | null;
  fk_estado: number;
  visible_en_navbar?: boolean;
  fk_vista_padre?: number | null;
  vista_padre_nombre?: string | null;
};

const PermisosAdmin: React.FC = () => {
  const [_isNavbarVisible, _setIsNavbarVisible] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"activo" | "inactivo">("activo");
  const [isModalPermisosUsuariosOpen, setIsModalPermisosUsuariosOpen] = useState(false);


  const {
    vistas, 
    roles, 
    vistaSeleccionada, 
    setVistaSeleccionada, 
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
  } = LogicaPermisosAdmin();

  const vistasFiltradas = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return vistas.filter((vista: Vista) => {
      const coincideBusqueda = vista.nombre.toLowerCase().includes(searchLower) || vista.ruta.toLowerCase().includes(searchLower) || (vista.descripcion?.toLowerCase().includes(searchLower) ?? false);
      const coincideEstado = (statusFilter === "activo" && vista.fk_estado === 1) || (statusFilter === "inactivo" && vista.fk_estado === 2);
      return coincideBusqueda && coincideEstado;
    });
  }, [vistas, searchTerm, statusFilter]);

  const handleAbrirGestionUsuarios = (vista: Vista) => {
    setVistaSeleccionada(vista);
    setIsModalPermisosUsuariosOpen(true);
  };

  const handleCerrarModalPermisos = () => {
    if (hayCambiosPendientes) {
      Swal.fire({
        title: "¿Descartar cambios?",
        text: "Tienes cambios sin guardar. ¿Deseas descartarlos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#172b4d",
      }).then((result: SweetAlertResult) => {
        if (result.isConfirmed) {
          descartarCambiosPermisos();
          setIsModalPermisosUsuariosOpen(false);
          setVistaSeleccionada(null);
        }
      });
      return;
    }
    setIsModalPermisosUsuariosOpen(false);
    setVistaSeleccionada(null);
  };

  const handleGuardarYCerrar = async () => {
    await guardarCambiosPermisos();
    setIsModalPermisosUsuariosOpen(false);
    setVistaSeleccionada(null);
  };

  return (
    <>
      <PantallaCarga isLoading={cargando} />
        <div className="row">
                <div className="col-12">
                    <h1 className={shared.tituloSeccion}>
                      <i className="bi bi-building me-3"></i>
                      Políticas de Acceso
                    </h1>
                </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="contenedor-msj-bienvenida">
              <h3 style={{ color: "#626161", fontSize: "30px", fontFamily: "poppins" }}>
                Gestión de Permisos de Acceso
              </h3>
              <p style={{ fontFamily: "poppins", fontSize: "20px" }}>
                Administra qué roles y usuarios pueden acceder a cada vista del sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="input row mt-3 align-ítems-center">
          <div className="col-md-4">
            <input type="text" className="form-control custom-input" placeholder="Buscar vistas por nombre o ruta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoComplete="off" />
          </div>
          <div className="col-md-3">
            <select className="form-control custom-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "activo" | "inactivo")}>
              <option value="activo">Activas</option>
              <option value="inactivo">Inactivas</option>
            </select>
          </div>
          <div className="col-md-auto ms-auto">
            <button className="btn btn-principal custom-button" onClick={() => setIsModalVistaOpen(true)}>
              <FaPlus className="icon plus-icon me-2" />Nueva Vista
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="title-container">
            <br/>
            <h2 className="custom-title">Vistas del Sistema</h2>
          </div>
          <div className="mod-grid-modulos">
            {vistasFiltradas.length > 0 ? (
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

        <Modal
          isOpen={isModalVistaOpen}
          onClose={() => { setIsModalVistaOpen(false); limpiarCamposVista(); }}
          title={vistaEditando ? "Editar Vista" : "Nueva Vista"}
          onSave={vistaEditando ? handleEditarVista : handleRegistrarVista}
          txtBoton={vistaEditando ? "Guardar Cambios" : "Crear Vista"}
          botonClassName="btn-principal custom-button"
        >
          <div className="container">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="nombre" className="form-label fw-bold">Nombre <span className="text-danger">*</span></label>
                <input type="text" className={`form-control ${errores.nombre ? "is-invalid" : ""}`} id="nombre" name="nombre" onChange={handleInputChangeVista} value={vistaData.nombre || ""} autoComplete="off" placeholder="Ej: Licitaciones" />
                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="ruta" className="form-label fw-bold">Ruta <span className="text-danger">*</span></label>
                <input type="text" className={`form-control ${errores.ruta ? "is-invalid" : ""}`} id="ruta" name="ruta" onChange={handleInputChangeVista} value={vistaData.ruta || ""} placeholder="/licitaciones" autoComplete="off" />
                {errores.ruta && <div className="invalid-feedback">{errores.ruta}</div>}
                <small className="text-muted">Debe comenzar con /</small>
              </div>

              <div className="col-md-6">
                <label htmlFor="icono" className="form-label fw-bold">Icono</label>
                <div className="position-relative">
                  <input type="text" className="form-control" id="icono" name="icono" onChange={handleInputChangeVista} value={vistaData.icono || ""} placeholder="bi-house" autoComplete="off" style={{ paddingRight: vistaData.icono ? '40px' : undefined }} />
                  {vistaData.icono && <span className="position-absolute top-50 end-0 translate-middle-y me-3" style={{ pointerEvents: 'none' }}><i className={`bi ${vistaData.icono}`}></i></span>}
                </div>
                <small className="text-muted">Ej: bi-house, bi-person, bi-gear</small>
              </div>

              <div className="col-md-6">
                <label htmlFor="fk_estado" className="form-label fw-bold">Estado</label>
                <select className="form-select" id="fk_estado" name="fk_estado" onChange={handleInputChangeVista} value={vistaData.fk_estado ?? 1}>
                  <option value={1}>Activo</option>
                  <option value={2}>Inactivo</option>
                </select>
                {vistaEditando && esVistaProtegida(vistaEditando) && vistaEditando.fk_estado === 1 && (
                  <small className="text-warning d-block mt-1"><i className="bi bi-lock-fill me-1"></i>Esta vista está protegida y no puede ser desactivada</small>
                )}
              </div>

      

              <div className="col-md-6">
                <label htmlFor="visible_en_navbar" className="form-label fw-bold">Visibilidad en Menú</label>
                <select className="form-select" id="visible_en_navbar" name="visible_en_navbar" onChange={handleInputChangeVista} value={String(vistaData.visible_en_navbar ?? true)}>
                  <option value="true">Visible en menú</option>
                  <option value="false">Oculta del menú</option>
                </select>
                <small className="text-muted">{vistaData.visible_en_navbar === false ? "Esta vista no aparecerá en el menú lateral" : "Esta vista aparecerá en el menú lateral"}</small>
              </div>

              <div className="col-md-12">
                <label htmlFor="descripcion" className="form-label fw-bold">Descripción</label>
                <textarea className="form-control" id="descripcion" name="descripcion" rows={3} onChange={handleInputChangeVista} value={vistaData.descripcion || ""} placeholder="Describe brevemente para qué sirve esta vista..." />
              </div>
            </div>
          </div>
        </Modal>

        <Modal
            isOpen={isModalPermisosUsuariosOpen}
            onClose={handleCerrarModalPermisos}
            title={vistaSeleccionada ? `Permisos de: ${vistaSeleccionada.nombre}` : "Gestión de Permisos"}
            txtBoton="Guardar Cambios"
            botonClassName="btn-principal"
            onSave={handleGuardarYCerrar}
            disableButton={!hayCambiosPendientes}
          >
            {vistaSeleccionada && (
              <div className="container-fluid">
                <div className="mb-3">
                  <small className="text-muted d-block">
                    <strong>Ruta:</strong> <code>{vistaSeleccionada.ruta}</code>
                  </small>
                  {esVistaProtegida(vistaSeleccionada) && (
                    <div className="alert alert-info mt-2" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      Esta vista está protegida. Los permisos del rol Administrador no pueden ser modificados.
                    </div>
                  )}
                  {hayCambiosPendientes && (
                    <div className="alert alert-warning mt-2" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
                    </div>
                  )}
                </div>

                {roles.map((rol: any) => {
                  const tieneAcceso = rolTieneAcceso(rol.pk_rol);
                  const esRolProtegido = esPermisoProtegido(rol.pk_rol);

                  return (
                    <div key={rol.pk_rol} className="rol-seccion-modal mb-3">
                      <div className="rol-header-modal">
                        <div className="rol-info-modal">
                          <h6 className="mb-0">
                            <i className="bi bi-person-badge me-2"></i>
                            {rol.nombre_rol}
                            {esRolProtegido && (
                              <i className="bi bi-lock-fill ms-2 text-warning" title="Permiso protegido"></i>
                            )}
                          </h6>
                        </div>
                        <button
                          className={`btn permiso-rol-btn ${tieneAcceso ? "permitido" : "denegado"} ${esRolProtegido ? "protegido" : ""}`}
                          onClick={() => handleTogglePermisoRol(rol.pk_rol, !tieneAcceso)}
                          type="button"
                          disabled={esRolProtegido}
                          title={
                            esRolProtegido
                              ? "Este permiso está protegido y no puede ser modificado"
                              : tieneAcceso
                              ? "Clic para denegar"
                              : "Clic para permitir"
                          }
                        >
                          {esRolProtegido && <i className="bi bi-lock-fill me-1"></i>}
                          {tieneAcceso
                            ? <><FaToggleOn className="me-1" /> Permitido</>
                            : <><FaToggleOff className="me-1" /> Denegado</>
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
    </>
  );
};

export default PermisosAdmin;