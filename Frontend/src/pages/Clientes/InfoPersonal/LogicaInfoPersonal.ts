import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Datos de perfil del usuario autenticado tal como los devuelve el backend. */
export interface InfoUsuario {
  pk_usuario:           number;
  usuario:              string;
  correo:               string;
  nombre:               string | null;
  telefono:             string | null;
  numero_identificacion: string | null;
  rol:                  string;
  estado:               string;
}

/** Campos editables del formulario de actualización de perfil. */
export interface FormPerfil {
  nombre:               string;
  usuario:              string;
  correo:               string;
  telefono:             string;
  numero_identificacion: string;
  /** Si está vacío al guardar, el backend no modifica la contraseña. */
  contrasena:           string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const ENDPOINT = `${API_URL}/usuarios/mi-perfil/`;

const authCfg = () => ({ withCredentials: true });

const FORM_VACIO: FormPerfil = {
  nombre:               "",
  usuario:              "",
  correo:               "",
  telefono:             "",
  numero_identificacion: "",
  contrasena:           "",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook de lógica para el módulo Información Personal.
 *
 * Responsabilidades:
 * - Cargar y mostrar los datos de perfil del usuario autenticado (GET).
 * - Abrir un modal editable pre-cargado con los datos actuales.
 * - Enviar únicamente los campos modificados al backend (PATCH parcial).
 * - La contraseña solo se incluye en el payload si el campo tiene valor.
 *
 * @returns Estado del perfil, control del modal, formulario y handlers.
 */
export const LogicaInfoPersonal = () => {
  const [perfil,       setPerfil]       = useState<InfoUsuario | null>(null);
  const [cargando,     setCargando]     = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form,         setForm]         = useState<FormPerfil>(FORM_VACIO);
  const [guardando,    setGuardando]    = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────────

  /**
   * Obtiene los datos del perfil del usuario autenticado.
   * Los 401/403 se suprimen porque el interceptor de `api.tsx` ya los gestiona.
   */
  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const res = await api.get(ENDPOINT, authCfg());
      setPerfil(res.data?.data ?? null);
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        Alerts.error("Error al cargar la información del perfil");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargarPerfil(); }, []);

  // ── Modal ────────────────────────────────────────────────────────────────────

  /**
   * Pre-carga el formulario con los datos actuales del perfil y abre el modal.
   * No hace nada si el perfil todavía no ha cargado.
   */
  const abrirModal = () => {
    if (!perfil) return;
    setForm({
      nombre:               perfil.nombre               ?? "",
      usuario:              perfil.usuario,
      correo:               perfil.correo,
      telefono:             perfil.telefono             ?? "",
      numero_identificacion: perfil.numero_identificacion ?? "",
      contrasena:           "",
    });
    setModalAbierto(true);
  };

  /** Cierra el modal y restablece el formulario a valores vacíos. */
  const cerrarModal = () => {
    setModalAbierto(false);
    setForm(FORM_VACIO);
  };

  // ── Formulario ───────────────────────────────────────────────────────────────

  /**
   * Handler genérico para los inputs del formulario.
   * Actualiza el campo indicado por `name` con el valor del evento.
   * @param e - Evento de cambio del input.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Envía el formulario al backend con PATCH parcial.
   *
   * - El campo `contrasena` solo se incluye si el usuario escribió algo.
   * - Si la respuesta tiene errores de validación (400), muestra el primer error.
   * - En éxito, actualiza el perfil en estado local y cierra el modal.
   */
  const guardarPerfil = async () => {
    try {
      setGuardando(true);
      const payload: Record<string, string> = {
        nombre:               form.nombre,
        usuario:              form.usuario,
        correo:               form.correo,
        telefono:             form.telefono,
        numero_identificacion: form.numero_identificacion,
      };
      if (form.contrasena.trim()) {
        payload.contrasena = form.contrasena;
      }
      const res = await api.patch(ENDPOINT, payload, authCfg());
      setPerfil(res.data?.data ?? perfil);
      Alerts.success("Perfil actualizado exitosamente");
      cerrarModal();
    } catch (error: any) {
      const errores = error?.response?.data?.data;
      if (errores && typeof errores === "object") {
        const primer = Object.values(errores)[0];
        Alerts.error(Array.isArray(primer) ? String(primer[0]) : String(primer));
      } else {
        Alerts.error("Error al actualizar el perfil");
      }
    } finally {
      setGuardando(false);
    }
  };

  return {
    perfil,
    cargando,
    modalAbierto,
    form,
    guardando,
    abrirModal,
    cerrarModal,
    handleChange,
    guardarPerfil,
  };
};
