import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Alerts } from '../../../components/Alertas/alertas';
import api from "../../../api";

export const LogicaDetalleMiProducto = () => {

    interface ProductoInterfaz {
        pk_producto?: number | null;
        nombre?: string | null;
        precio?: string | null;
        detalles?: string | null;
        stock?: number | null;
        codigo_producto?: string | null;
        muestra_nombre?: boolean | null;
        muestra_telefono?: boolean | null;
        muestra_correo?: boolean | null;
        ruta_imagen?: string | null;
        fk_estado?: number | null;
    }

    const [estados, setEstados] = useState<{ pk_estado: number; nombre: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ProductoEditando, setProductoEditando] = useState<ProductoInterfaz | null>(null);
    const [errores, setErrores] = useState<{ [key: string]: string }>({});
    const [Cargando, setCargando] = useState(false);
    const [ProductosData, setProductosData] = useState<ProductoInterfaz>({
       nombre : '',
       precio : '',
       detalles : '',
       stock : 0,
       codigo_producto : '',
       muestra_nombre : false,
       muestra_telefono : false,
       muestra_correo : false,
       ruta_imagen : '',
       fk_estado : 1,
    });
   
    useEffect(() => {
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

    const handleInputChangeProductos = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (ProductoEditando) {
            setProductoEditando({
                ...ProductoEditando,
                [name]: value,
            });

        } else {
            setProductosData({
                ...ProductosData,
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
        
        const datos = ProductoEditando || ProductosData;

        if (!datos.nombre?.trim()) {
            nuevosErrores.nombre = "Nombre es requerido";
        }
        if (!datos.precio) {
            nuevosErrores.precio = "Precio es requerido";
        }
        if (!datos.detalles) {
            nuevosErrores.detalles = "Detalles es requerido";
        }
        if (!datos.stock) {
            nuevosErrores.stock = "Stock es requerido";
        }
        if (!datos.codigo_producto?.trim()) {
            nuevosErrores.codigo_producto = "Código de producto es requerido";
        }
        if (!datos.fk_estado) {
            nuevosErrores.fk_estado = "Estado es requerido";
        }

        if (!ProductoEditando && !datos.ruta_imagen?.trim()) {
            nuevosErrores.ruta_imagen = "Ruta de imagen es requerida";
        }


        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    return {
        estados,
        isModalOpen,
        setIsModalOpen,
        errores,
        setErrores,
        obtenerEstados,
        ProductoEditando,
        setProductoEditando,
        Cargando,
        validarCampos,
        ProductosData,
        setProductosData,
        handleInputChangeProductos,
        estadosFiltrados,

    };
};