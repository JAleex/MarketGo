import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Alerts } from '../../../components/Alertas/alertas';
import api from "../../../api";

export const LogicaUsuariosAdmin = () => {

    interface UsuariosInterfaz {
        pk_usuario?: number | null;
        usuario?: string | null;
        contrasena?: string | null;
        numero_identificacion?: string | null;
        telefono?: string | null;
        correo?: string | null;
        nombre?: string | null;
        fk_rol?: number | null;
        fk_estado?: number | null;
        estado?: string | null;
    }

    const [estados, setEstados] = useState<{ pk_estado: number; nombre: string }[]>([]);
    const [infoUsuarios, setInfoUsuarios] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("activo");
    const [UsuariosData, setUsuariosData] = useState<UsuariosInterfaz>({
        usuario: '',
        contrasena: '',
        numero_identificacion: '',
        telefono: '',
        correo: '',
        nombre: '',
        fk_rol: 2, 
        fk_estado: null,
    });
    const [UsuariosEditando, setUsuariosEditando] = useState<UsuariosInterfaz | null>(null);
    const [errores, setErrores] = useState<{ [key: string]: string }>({});
    const [Cargando, setCargando] = useState(false);
    const [dataUsuariosPanel, setDataUsuariosPanel] = useState<{
        usuarios_cantidad: number;
        usuarios_activos: number;
        usuarios_inactivos: number;
    } | null>(null);

    useEffect(() => {
        obtenerUsuarios();
        obtenerEstados(); 
    }, []);

    const getAuthHeaders = () => {
        return { withCredentials: true };
    };

    const obtenerEstados = async () => {
        try {
            setCargando(true);
            const response = await api.get(`${import.meta.env.VITE_API_URL}/usuarios/estados/`);
            setEstados(response.data);
            setCargando(false);
        } catch (error) {
            setCargando(false);
            Alerts.error("Error al obtener los estados");
        }
    };

    const estadosFiltrados = estados.filter(
        (estado) => estado.pk_estado === 1 || estado.pk_estado === 2
    );

    const obtenerUsuarios = async () => {
        try {
            const headers = getAuthHeaders();
            setCargando(true);
            const response = await api.get(
                `${import.meta.env.VITE_API_URL}/usuarios/usuarios/`,
                headers
            );
            
            const usuariosArray = response.data?.data || [];
            
            setInfoUsuarios(usuariosArray);

            setCargando(false);
        } catch (error) {
            setCargando(false);
            Alerts.error("Error al obtener los usuarios");
            setInfoUsuarios([]);
        }
    };

    const handleInputChangeUsuarios = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (UsuariosEditando) {
            setUsuariosEditando({
                ...UsuariosEditando,
                [name]: value,
            });

            if (name === "contrasena") {
                setUsuariosData({
                    ...UsuariosData,
                    [name]: value,
                });
            }
        } else {
            setUsuariosData({
                ...UsuariosData,
                [name]: value,
            });
        }

        if (errores[name]) {
            setErrores({
                ...errores,
                [name]: "",
            });
        }
    };

    const validarCampos = () => {
        const nuevosErrores: { [key: string]: string } = {};
        
        const datos = UsuariosEditando || UsuariosData;

        if (!datos.usuario?.trim()) {
            nuevosErrores.usuario = "Usuario es requerido";
        }
        if (!datos.numero_identificacion) {
            nuevosErrores.numero_identificacion = "Número de identificación es requerido";
        }
        if (!datos.correo) {
            nuevosErrores.correo = "Correo es requerido";
        }
        if (datos.correo && !datos.correo.includes('@')) {
            nuevosErrores.correo = "El correo debe ser válido";
        }
        if (!datos.fk_estado) {
            nuevosErrores.fk_estado = "Estado es requerido";
        }

        if (!UsuariosEditando && !UsuariosData.contrasena?.trim()) {
            nuevosErrores.contrasena = "Contraseña es requerida";
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleRegistrarUsuarios = async () => {
        if (validarCampos()) {
            setCargando(true);
            try {
                const headers = getAuthHeaders();

                const datosUsuariosRegistro = {
                    usuario: UsuariosData.usuario,
                    contrasena: UsuariosData.contrasena,
                    numero_identificacion: UsuariosData.numero_identificacion,
                    telefono: UsuariosData.telefono || "" ,
                    correo: UsuariosData.correo,
                    nombre: UsuariosData.nombre || "",
                    fk_rol: 2,
                    fk_estado: Number(UsuariosData.fk_estado),
                };

                await api.post(
                    `${import.meta.env.VITE_API_URL}/usuarios/usuarios/crear/`,
                    datosUsuariosRegistro,
                    headers
                );

                Alerts.success("Usuario registrado correctamente");
                obtenerUsuarios();
                setIsModalOpen(false);
                limpiarCampos();
                setCargando(false);
            } catch (error: any) {
                setCargando(false);
                
                let mensajeError = "Hubo un problema al registrar el Usuario";
                
                if (error?.response?.data) {
                    const errorData = error.response.data;
                    
                    if (errorData.data && typeof errorData.data === 'object') {
                        const erroresValidacion = errorData.data;
                        const mensajes = Object.entries(erroresValidacion)
                            .map(([campo, mensajes]) => {
                                if (Array.isArray(mensajes)) {
                                    return `${campo}: ${mensajes.join(', ')}`;
                                }
                                return `${campo}: ${mensajes}`;
                            })
                            .join('\n');
                        mensajeError = mensajes;
                    } 
                    else if (errorData.message) {
                        mensajeError = errorData.message;
                    }
                    else if (typeof errorData.data === 'string') {
                        mensajeError = errorData.data;
                    }
                }
                
                Alerts.error(mensajeError);
            }
        }
    };

    const handleGuardarEdicion = async () => {
        if (!UsuariosEditando) return;

        if (validarCampos()) {
            try {
                const headers = getAuthHeaders();
                setCargando(true);

                const datosEvaluadorActualizados: any = {
                    usuario: UsuariosEditando.usuario,
                    numero_identificacion: UsuariosEditando.numero_identificacion,
                    telefono: UsuariosEditando.telefono || "",
                    correo: UsuariosEditando.correo,
                    nombre: UsuariosEditando.nombre || "",
                    fk_rol: 2,
                    fk_estado: Number(UsuariosEditando.fk_estado),
                };

                if (UsuariosData.contrasena && UsuariosData.contrasena.trim() !== "") {
                    datosEvaluadorActualizados.contrasena = UsuariosData.contrasena;
                }

                await api.patch(
                    `${import.meta.env.VITE_API_URL}/usuarios/usuarios/${UsuariosEditando.pk_usuario}/actualizar/`,
                    datosEvaluadorActualizados,
                    headers
                );

                Alerts.success("Evaluador editado correctamente");
                obtenerUsuarios();
                setIsModalOpen(false);
                limpiarCampos();
                setCargando(false);
            } catch (error: any) {
                setCargando(false);
                
                let mensajeError = "Hubo un problema al actualizar el Usuario";
                
                if (error?.response?.data) {
                    const errorData = error.response.data;
                    
                    if (errorData.data && typeof errorData.data === 'object') {
                        const erroresValidacion = errorData.data;
                        const mensajes = Object.entries(erroresValidacion)
                            .map(([campo, mensajes]) => {
                                if (Array.isArray(mensajes)) {
                                    return `${campo}: ${mensajes.join(', ')}`;
                                }
                                return `${campo}: ${mensajes}`;
                            })
                            .join('\n');
                        mensajeError = mensajes;
                    } 
                    else if (errorData.message) {
                        mensajeError = errorData.message;
                    }
                    else if (typeof errorData.data === 'string') {
                        mensajeError = errorData.data;
                    }
                }
                
                Alerts.error(mensajeError);
            }
        }
    };

    const limpiarCampos = () => {
        setUsuariosEditando(null);
        setUsuariosData({
            usuario: "",
            contrasena: "",
            numero_identificacion: "",
            telefono: "",
            correo: "",
            nombre: "",
            fk_rol: 2,
            fk_estado: null,
        });
        setErrores({});
    };

    const handleVerUsuarios = async (row: UsuariosInterfaz) => {
        const estado = estados.find(e => e.pk_estado === row.fk_estado);
        
        Alerts.detail({
            title: "Información del Usuario",
            rows: [
            {
                label: "Usuario",
                value: `${row.nombre ?? ""}`
            },
            {
                label: "Estado",
                value: estado?.nombre,
                type: "badge",
                variant: row.fk_estado === 1 ? "ok" : "bad"
            },
            { label: "Usuario", value: row.usuario },
            { label: "Correo", value: row.correo },
            { label: "Teléfono", value: row.telefono },
            {
                label: "Documento",
                value: `${row.numero_identificacion ?? ""}`
            },
            { label: "Rol", value: "Cliente" }
            ],
            onCancel: () => handleEditarUsuarios(row)
        });
        };

    const handleCambiarEstadoUsuarios = async (row: any) => {
        const result = await Alerts.confirm(
            `¿Deseas cambiar el estado de este Usuario?`,
            {
                title: "¿Estás seguro?",
                confirmText: "Sí, cambiar",
                cancelText: "Cancelar"
            }
        );

        if (result.isConfirmed) {
            try {
                const headers = getAuthHeaders();
                setCargando(true);

                const endpoint = row.fk_estado === 1
                    ? `${import.meta.env.VITE_API_URL}/usuarios/usuarios/${row.pk_usuario}/desactivar/`
                    : `${import.meta.env.VITE_API_URL}/usuarios/usuarios/${row.pk_usuario}/activar/`;

                await api.patch(endpoint, {}, headers);

                Alerts.success("Estado cambiado correctamente");
                obtenerUsuarios();
                setCargando(false);
            } catch (error) {
                setCargando(false);
                Alerts.error("No se pudo cambiar el estado del Usuario");
            }
        }
    };

    const handleEditarUsuarios = (row: UsuariosInterfaz) => {
        setUsuariosEditando(row);
        setUsuariosData({
            ...UsuariosData,
            contrasena: ""
        });
        setIsModalOpen(true);
    };

    return {
        estados,
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
        dataUsuariosPanel,
        setDataUsuariosPanel,
        obtenerEstados,
    };
};