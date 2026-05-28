import { useRef, useState } from 'react';
import { Alerts } from '../../../components/Alertas/alertas';
import api from "../../../api";

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINTS = {
  editar: (pk: number) => `${API_URL}/productos/mis-productos/${pk}/editar/`,
};

const authCfg = () => ({ withCredentials: true });

export interface ProductoEditForm {
  pk_producto:      number | null;
  nombre:           string;
  precio:           string;
  detalles:         string;
  stock:            string;
  codigo_producto:  string;
  muestra_nombre:   boolean;
  muestra_telefono: boolean;
  muestra_correo:   boolean;
  fk_estado:        number;
}

const FORM_VACIO: ProductoEditForm = {
  pk_producto:      null,
  nombre:           '',
  precio:           '',
  detalles:         '',
  stock:            '',
  codigo_producto:  '',
  muestra_nombre:   false,
  muestra_telefono: false,
  muestra_correo:   false,
  fk_estado:        1,
};

export const LogicaDetalleMiProducto = () => {

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [errores, setErrores]               = useState<Record<string, string>>({});
  const [guardando, setGuardando]           = useState(false);
  const [form, setForm]                     = useState<ProductoEditForm>(FORM_VACIO);
  const [imagenFile, setImagenFile]         = useState<File | null>(null);
  const [imagenPreview, setImagenPreview]   = useState<string | null>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // ── Abrir modal pre-cargando datos del producto actual ────────────────────

  const abrirModalEditar = (producto: {
    pk_producto:      number;
    nombre:           string;
    precio:           number;
    detalles:         string | null;
    stock:            string | null;
    codigo_producto:  string;
    muestra_nombre:   boolean;
    muestra_telefono: boolean;
    muestra_correo:   boolean;
    fk_estado:        number;
    imagen_url:       string | null;
  }) => {
    setForm({
      pk_producto:      producto.pk_producto,
      nombre:           producto.nombre,
      precio:           String(producto.precio),
      detalles:         producto.detalles ?? '',
      stock:            producto.stock ?? '0',
      codigo_producto:  producto.codigo_producto,
      muestra_nombre:   producto.muestra_nombre,
      muestra_telefono: producto.muestra_telefono,
      muestra_correo:   producto.muestra_correo,
      fk_estado:        producto.fk_estado,
    });
    setImagenFile(null);
    setImagenPreview(producto.imagen_url);   // muestra la imagen actual
    setErrores({});
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setErrores({});
    setImagenFile(null);
    setImagenPreview(null);
    setForm(FORM_VACIO);
  };

  // ── Cambios en inputs / selects / checkboxes ──────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ── Imagen ────────────────────────────────────────────────────────────────

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Alerts.error('Solo se permiten archivos de imagen (jpg, png, webp…)');
      return;
    }
    setImagenFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagenPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Validación ────────────────────────────────────────────────────────────

  const validarCampos = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.nombre.trim())
      e.nombre = 'El nombre es requerido';
    else if (form.nombre.trim().length < 3)
      e.nombre = 'Mínimo 3 caracteres';

    if (!form.precio.trim())
      e.precio = 'El precio es requerido';
    else if (isNaN(Number(form.precio)) || Number(form.precio) <= 0)
      e.precio = 'Ingresa un precio válido mayor a 0';

    if (!form.codigo_producto.trim())
      e.codigo_producto = 'El código es requerido';

    if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      e.stock = 'El stock debe ser 0 o mayor';

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Guardar edición ───────────────────────────────────────────────────────

  const handleGuardarEdicion = async (): Promise<boolean> => {
    if (!validarCampos() || !form.pk_producto) return false;

    try {
      setGuardando(true);

      const fd = new FormData();
      fd.append('nombre',           form.nombre.trim());
      fd.append('precio',           form.precio);
      fd.append('detalles',         form.detalles);
      fd.append('stock',            form.stock || '0');
      fd.append('codigo_producto',  form.codigo_producto.trim());

      // fk_estado: aseguramos que siempre sea un número entero válido
      fd.append('fk_estado',        String(Number(form.fk_estado) || 1));

      // booleanos: Django con multipart espera "true"/"false" en minúsculas
      fd.append('muestra_nombre',   form.muestra_nombre   ? 'true' : 'false');
      fd.append('muestra_telefono', form.muestra_telefono ? 'true' : 'false');
      fd.append('muestra_correo',   form.muestra_correo   ? 'true' : 'false');

      if (imagenFile) fd.append('imagen', imagenFile);

      await api.patch(
        ENDPOINTS.editar(form.pk_producto),
        fd,
        { ...authCfg(), headers: { 'Content-Type': 'multipart/form-data' } }
      );

      Alerts.success('Producto actualizado exitosamente');
      cerrarModal();
      return true;            // señal para que el componente recargue el detalle

    } catch (error: any) {
      if (error?.response?.data?.data) {
        const backendErrors = error.response.data.data;
        setErrores(backendErrors);
        const primero = Object.values(backendErrors)[0];
        Alerts.error(Array.isArray(primero) ? primero[0] : String(primero));
      } else {
        Alerts.error(error?.response?.data?.message ?? 'Error al actualizar el producto');
      }
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    // modal
    isModalOpen,
    setIsModalOpen,
    abrirModalEditar,
    cerrarModal,
    // form
    form,
    errores,
    setErrores,
    guardando,
    imagenPreview,
    fileInputRef,
    handleInputChange,
    handleImagenChange,
    quitarImagen,
    // acción
    handleGuardarEdicion,
    validarCampos,
  };
};