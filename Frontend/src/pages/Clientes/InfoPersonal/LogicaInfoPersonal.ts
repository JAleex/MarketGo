import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface FormPerfil {
  nombre:               string;
  usuario:              string;
  correo:               string;
  telefono:             string;
  numero_identificacion: string;
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

export const LogicaInfoPersonal = () => {
  const [perfil,       setPerfil]       = useState<InfoUsuario | null>(null);
  const [cargando,     setCargando]     = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form,         setForm]         = useState<FormPerfil>(FORM_VACIO);
  const [guardando,    setGuardando]    = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────────

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

  const cerrarModal = () => {
    setModalAbierto(false);
    setForm(FORM_VACIO);
  };

  // ── Formulario ───────────────────────────────────────────────────────────────

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
