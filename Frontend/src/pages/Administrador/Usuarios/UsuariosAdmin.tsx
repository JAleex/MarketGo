import React, { useMemo } from 'react';
import "../../../styles/Shared/shared.css"
import "../../../styles/Administrador/EvaluadoresAdmin.css"
import TablasConPaginacion from "../../../components/Tablas/TablasConPaginacion";
import { LogicaUsuariosAdmin } from './LogicaUsuariosAdmin';
import { FaEye, FaPencilAlt, FaPlus } from "react-icons/fa";
import Modal from "../../../components/Modales/Modal";
import Select from 'react-select';
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import PantallaCarga from '../../../components/PantallaCarga/PantallaCarga';
import shared from "../../../styles/Shared/shared.module.css"

const UsuariosAdmin: React.FC = () => {
    const {
        isModalOpen,
        setIsModalOpen,
        errores,
        setErrores,
        infoUsuarios,
        estadosFiltrados,
        handleRegistrarUsuarios,
        UsuariosEditando,
        handleInputChangeUsuarios,
        UsuariosData,
        handleGuardarEdicion,
        setUsuariosEditando,
        setUsuariosData,
        handleVerUsuarios,
        handleCambiarEstadoUsuarios,
        handleEditarUsuarios,
        limpiarCampos,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        Cargando,
        obtenerEstados,
    } = LogicaUsuariosAdmin();

    const evaluadoresFiltrados = useMemo(() => {
        return infoUsuarios.filter((usuario: any) => {
            const searchTermLower = searchTerm.toLowerCase();
            const nombreLower = usuario.nombre.toLowerCase();
            const usuarioLower = usuario.usuario.toLowerCase();

            const coincideBusqueda =
                nombreLower.includes(searchTermLower) ||
                usuarioLower.includes(searchTermLower)

            const coincideEstado =
                (statusFilter === "activo" && usuario.fk_estado === 1) ||
                (statusFilter === "inactivo" && usuario.fk_estado === 2);

            return coincideBusqueda && coincideEstado;
        });
    }, [infoUsuarios, searchTerm, statusFilter]);

    const obtenerValorEstado = () => {
        const estadoId = UsuariosEditando 
            ? UsuariosEditando.fk_estado 
            : UsuariosData.fk_estado;
        
        if (!estadoId || estadosFiltrados.length === 0) return null;
        
        const estado = estadosFiltrados.find(e => e.pk_estado === estadoId);
        
        return estado ? {
            value: estado.pk_estado,
            label: estado.nombre
        } : null;
    };

    return (
        <>
            <PantallaCarga isLoading={Cargando} />
                <div className="row">
                    <div className="col-12">
                        <h1 className={shared.tituloSeccion}>
                        <i className="bi bi-people me-3"></i>
                        Clientes
                        </h1>
                    </div>
                </div>

                <div className="row align-items-stretch">
                    <div className="col-12 h-100">
                        <div className="row">
                            <div className="col-12">
                                <div className="contenedor-msj-bienvenida">
                                    <h3 style={{ color: '#626161', fontSize: '30px', fontFamily: 'poppins' }}>
                                        Bienvenido, a la sección de Clientes!
                                    </h3>
                                    <p style={{ fontFamily: 'poppins', fontSize: '20px' }}>
                                        En esta sección podrá encontrar la información de los Clientes del sistema.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="input row mt-3 align-ítems-center">
                            <div className="col-md-4">
                                <input
                                    type="text"
                                    className="form-control custom-input"
                                    placeholder="Buscar por nombre, usuario o identificación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-control custom-input"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="activo">Activos</option>
                                    <option value="inactivo">Inactivos</option>
                                </select>
                            </div>
                            <div className="col-md-auto ms-auto">
                                <button 
                                    className="btn btn-principal" 
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        obtenerEstados();
                                    }}
                                >
                                    <FaPlus className="icon plus-icon me-2" />
                                    Nuevo Cliente
                                </button>
                            </div>
                        </div>

                        {/* Tabla de clientes */}
                        <div className="table-container">
                            <div className="title-container">
                                <h2 className='custom-title'>Listado de Clientes</h2>
                            </div>
                            <TablasConPaginacion
                                data={evaluadoresFiltrados}
                                rowsPerPage={5}
                                columns={[
                                    { key: "usuario", label: "Usuario" },
                                    { key: "nombre", label: "Nombre" },
                                    { key: "numero_identificacion", label: "Identificación" },
                                    { key: "correo", label: "Correo" },
                                    { key: "estado", label: "Estado" },
                                    {
                                        key: "acciones",
                                        label: "Acciones",
                                        isActionColumn: true,
                                        render: (row: { fk_estado: number }) => (
                                            <div className="acciones">
                                                <button 
                                                    className="btn editar" 
                                                    onClick={() => {
                                                        handleEditarUsuarios(row);
                                                        setIsModalOpen(true);
                                                        obtenerEstados();
                                                    }}
                                                >
                                                    <FaPencilAlt className="icon edit-icon" />
                                                </button>
                                                <button 
                                                    className="btn ver" 
                                                    onClick={() => handleVerUsuarios(row)}
                                                >
                                                    <FaEye className="icon view-icon" />
                                                </button>
                                                <button
                                                    className={`btn ${row.fk_estado === 1 ? 'activo' : 'inactivo'}`}
                                                    onClick={() => handleCambiarEstadoUsuarios(row)}
                                                >
                                                    {row.fk_estado === 1 ? (
                                                        <FaToggleOn className="icon toggle-on" color='green' />
                                                    ) : (
                                                        <FaToggleOff className="icon toggle-off" color='red' />
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>                   
                </div>

                {/* Modal para crear/editar usuarios */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        limpiarCampos();
                        setErrores({});
                    }}
                    title={UsuariosEditando ? "Editar Usuario" : "Registrar Nuevo Usuario"}
                    onSave={UsuariosEditando ? handleGuardarEdicion : handleRegistrarUsuarios}
                    txtBoton={UsuariosEditando ? "Guardar Cambios" : "Guardar Usuario"}
                    botonClassName="btn-principal custom-button"
                >
                    <div className="container">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label htmlFor="nombre" className="form-label fw-bold">Nombre</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                                    id="nombre"
                                    name="nombre"
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosEditando ? UsuariosEditando.nombre ?? "" : UsuariosData.nombre ?? ""}
                                />
                                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                            </div>

                            
                        </div>

                        <div className="row g-3 mt-2">
                            <div className="col-md-6">
                                <label htmlFor="numero_identificacion" className="form-label fw-bold">Número de identificación</label>
                                <input
                                    type="number"
                                    className={`form-control ${errores.numero_identificacion ? "is-invalid" : ""}`}
                                    id="numero_identificacion"
                                    name="numero_identificacion"
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosEditando ? UsuariosEditando.numero_identificacion ?? "" : UsuariosData.numero_identificacion ?? ""}
                                />
                                {errores.numero_identificacion && <div className="invalid-feedback">{errores.numero_identificacion}</div>}
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="telefono" className="form-label fw-bold">Teléfono</label>
                                <input
                                    type="number"
                                    className={`form-control ${errores.telefono ? "is-invalid" : ""}`}
                                    id="telefono"
                                    name="telefono"
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosEditando ? UsuariosEditando.telefono ?? "" : UsuariosData.telefono ?? ""}
                                />
                                {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="fk_estado" className="form-label fw-bold">Estado</label>
                                <Select
                                    id="fk_estado"
                                    name="fk_estado"
                                    options={estadosFiltrados.map((estado) => ({
                                        value: estado.pk_estado,
                                        label: estado.nombre,
                                    }))}
                                    value={obtenerValorEstado()}
                                    onChange={(selectedOption) => {
                                        const value = selectedOption ? selectedOption.value : null;
                                        if (UsuariosEditando) {
                                            setUsuariosEditando({
                                                ...UsuariosEditando,
                                                fk_estado: value,
                                            });
                                        } else {
                                            setUsuariosData({
                                                ...UsuariosData,
                                                fk_estado: value,
                                            });
                                        }
                                        setErrores({ ...errores, fk_estado: "" });
                                    }}
                                    placeholder="Seleccione un estado"
                                    isClearable
                                    className={errores.fk_estado ? "is-invalid" : ""}
                                />
                                {errores.fk_estado && <div className="invalid-feedback d-block">{errores.fk_estado}</div>}
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="correo" className="form-label fw-bold">Correo</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.correo ? "is-invalid" : ""}`}
                                    id="correo"
                                    name="correo"
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosEditando ? UsuariosEditando.correo ?? "" : UsuariosData.correo ?? ""}
                                />
                                {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="usuario" className="form-label fw-bold">Usuario</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.usuario ? "is-invalid" : ""}`}
                                    id="usuario"
                                    name="usuario"
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosEditando ? UsuariosEditando.usuario ?? "" : UsuariosData.usuario ?? ""}
                                />
                                {errores.usuario && <div className="invalid-feedback">{errores.usuario}</div>}
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="contrasena" className="form-label fw-bold">
                                    Contraseña {UsuariosEditando && <span className="text-muted">(opcional)</span>}
                                </label>
                                <input
                                    type="password"
                                    className={`form-control ${errores.contrasena ? "is-invalid" : ""}`}
                                    id="contrasena"
                                    name="contrasena"
                                    placeholder={UsuariosEditando ? "Dejar vacío para mantener la contraseña actual" : "Ingrese la contraseña"}
                                    onChange={handleInputChangeUsuarios}
                                    value={UsuariosData.contrasena ?? ""}
                                />
                                {errores.contrasena && <div className="invalid-feedback">{errores.contrasena}</div>}
                            </div>
                        </div>
                    </div>
                </Modal>
        </>
    );
};

export default UsuariosAdmin;