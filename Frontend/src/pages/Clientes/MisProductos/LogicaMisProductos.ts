import { useEffect, useRef, useState } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductoCard {
  pk_producto: number;
  nombre: string;
  precio: number;
  fk_estado: number;
  fecha_publicacion: string;
  estado: string;
  codigo_producto: string;
  imagen_url: string | null;
}

export interface ProductoDetalle extends ProductoCard {
  detalles: string | null;
  stock: string | null;
  nombre_vendedor: string | null;
  telefono_vendedor: string | null;
  correo_vendedor: string | null;
}

// Form de creación
export interface ProductoForm {
  codigo_producto: string;
  nombre: string;
  precio: string;
  detalles: string;
  fk_estado: number;
  stock: string;
  muestra_telefono: boolean;
  muestra_nombre: boolean;
  muestra_correo: boolean;
}

const FORM_VACIO: ProductoForm = {
  codigo_producto: "",
  nombre: "",
  precio: "",
  detalles: "",
  fk_estado: 1,
  stock: "",
  muestra_telefono: false,
  muestra_nombre: false,
  muestra_correo: false,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  productos:      `${API_URL}/productos/mis-productos/`,
  crearProductos: `${API_URL}/productos/crear-mis-productos/`,
  productoById:   (pk: number) => `${API_URL}/productos/productos/${pk}/`,
  estadoProducto: (pk: number) => `${API_URL}/productos/cambiar-estado-producto/${pk}/`,
} as const;

const authCfg = () => ({ withCredentials: true });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const LogicaMisProductos = () => {

  const [productosOriginales, setProductosOriginales] = useState<ProductoCard[]>([]);
  const [productos, setProductos]                     = useState<ProductoCard[]>([]);
  const [cargando, setCargando]                       = useState(false);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrecio, setMinPrecio]   = useState("");
  const [maxPrecio, setMaxPrecio]   = useState("");

  // ── Modal crear producto ─────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [form, setForm]                     = useState<ProductoForm>(FORM_VACIO);
  const [erroresForm, setErroresForm]       = useState<Partial<ProductoForm>>({});
  const [guardando, setGuardando]           = useState(false);
  const [imagenFile, setImagenFile]         = useState<File | null>(null);
  const [imagenPreview, setImagenPreview]   = useState<string | null>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const res = await api.get(ENDPOINTS.productos, authCfg());
      const data = res.data?.data ?? [];
      setProductosOriginales(data);
      setProductos(data);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar los productos");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarProductos(); }, []);

  // ── Filtros en frontend ──────────────────────────────────────────────────────

  useEffect(() => {
    let filtrados = [...productosOriginales];
    if (searchTerm.trim()) {
      const texto = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(texto) ||
          p.codigo_producto?.toLowerCase().includes(texto)
      );
    }
    if (minPrecio.trim())
      filtrados = filtrados.filter((p) => Number(p.precio) >= Number(minPrecio));
    if (maxPrecio.trim())
      filtrados = filtrados.filter((p) => Number(p.precio) <= Number(maxPrecio));
    setProductos(filtrados);
  }, [searchTerm, minPrecio, maxPrecio, productosOriginales]);

  const limpiarFiltros = () => {
    setSearchTerm("");
    setMinPrecio("");
    setMaxPrecio("");
  };

  // ── Detalle producto ─────────────────────────────────────────────────────────

  const cargarDetalleProducto = async (pk: number): Promise<ProductoDetalle | null> => {
    try {
      const res = await api.get(ENDPOINTS.productoById(pk), authCfg());
      return res.data?.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) Alerts.error("Producto no encontrado");
      else if (error?.response?.status !== 401) Alerts.error("Error al cargar el producto");
      return null;
    }
  };

  // ── Toggle estado ────────────────────────────────────────────────────────────

  const handleToggleEstado = async (producto: ProductoCard) => {
    const nuevoEstado = producto.fk_estado === 1 ? 2 : 1;
    try {
      await api.patch(ENDPOINTS.estadoProducto(producto.pk_producto), {}, authCfg());
      setProductos((prev) =>
        prev.map((p) =>
          p.pk_producto === producto.pk_producto
            ? { ...p, fk_estado: nuevoEstado, estado: nuevoEstado === 1 ? "Activo" : "Inactivo" }
            : p
        )
      );
    } catch {
      Alerts.error("Error al cambiar el estado del producto");
    }
  };

  // ── Modal: abrir / cerrar ────────────────────────────────────────────────────

  const abrirModalCrear = () => {
    setForm(FORM_VACIO);
    setErroresForm({});
    setImagenFile(null);
    setImagenPreview(null);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setForm(FORM_VACIO);
    setErroresForm({});
    setImagenFile(null);
    setImagenPreview(null);
  };

  // ── Modal: manejo del form ───────────────────────────────────────────────────

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // limpiar error del campo al editar
    if (erroresForm[name as keyof ProductoForm]) {
      setErroresForm((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Alerts.error("Solo se permiten archivos de imagen (jpg, png, webp…)");
      return;
    }
    setImagenFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagenPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Validación ───────────────────────────────────────────────────────────────

  const validarForm = (): boolean => {
    const errores: Partial<Record<keyof ProductoForm, string>> = {};

    if (!form.codigo_producto.trim())
      errores.codigo_producto = "El código es requerido";

    if (!form.nombre.trim())
      errores.nombre = "El nombre es requerido";
    else if (form.nombre.trim().length < 3)
      errores.nombre = "Mínimo 3 caracteres";

    if (!form.precio.trim())
      errores.precio = "El precio es requerido";
    else if (isNaN(Number(form.precio)) || Number(form.precio) <= 0)
      errores.precio = "Ingresa un precio válido mayor a 0";

    if (form.stock.trim() !== "" && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      errores.stock = "El stock debe ser 0 o mayor";

    setErroresForm(errores);
    return Object.keys(errores).length === 0;
  };

  // ── Crear producto ───────────────────────────────────────────────────────────

  const handleCrearProducto = async () => {
    if (!validarForm()) return;

    try {
      setGuardando(true);

      const fd = new FormData();
      fd.append("codigo_producto",  form.codigo_producto.trim());
      fd.append("nombre",           form.nombre.trim());
      fd.append("precio",           form.precio);
      fd.append("detalles",         form.detalles);
      fd.append("fk_estado",        String(form.fk_estado));
      fd.append("stock",            form.stock || "0");
      fd.append("muestra_telefono", String(form.muestra_telefono));
      fd.append("muestra_nombre",   String(form.muestra_nombre));
      fd.append("muestra_correo",   String(form.muestra_correo));
      if (imagenFile) fd.append("imagen", imagenFile);

      await api.post(ENDPOINTS.crearProductos, fd, {
        ...authCfg(),
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alerts.success("Producto agregado exitosamente");
      cerrarModal();
      await cargarProductos(); 
    } catch (error: any) {
      if (error?.response?.data?.data) {
        const backendErrors = error.response.data.data;
        setErroresForm(backendErrors);
        const primerMensaje = Object.values(backendErrors)[0];
        Alerts.error(
          Array.isArray(primerMensaje) ? primerMensaje[0] : String(primerMensaje)
        );
      } else {
        Alerts.error(
          error?.response?.data?.message ?? "Error al crear el producto"
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // ── Helpers de formato ───────────────────────────────────────────────────────

  const formatPrecio = (precio: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(precio);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const hayFiltrosActivos = !!(searchTerm || minPrecio || maxPrecio);

  return {
    // listado
    productos,
    cargando,
    // filtros
    searchTerm, setSearchTerm,
    minPrecio,  setMinPrecio,
    maxPrecio,  setMaxPrecio,
    hayFiltrosActivos,
    limpiarFiltros,
    // toggle estado
    handleToggleEstado,
    // detalle
    cargarDetalleProducto,
    // modal crear
    isModalOpen,
    abrirModalCrear,
    cerrarModal,
    form,
    erroresForm,
    guardando,
    imagenPreview,
    fileInputRef,
    handleFormChange,
    handleImagenChange,
    handleCrearProducto,
    // helpers
    formatPrecio,
    formatFecha,
  };
};