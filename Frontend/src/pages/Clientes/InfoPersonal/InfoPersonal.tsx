import React from "react";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import Modal from "../../../components/Modales/Modal";
import { LogicaInfoPersonal } from "./LogicaInfoPersonal";
import "../../../styles/Shared/shared.css";

// ─── Campo solo lectura ───────────────────────────────────────────────────────

const CampoLectura: React.FC<{ label: string; valor: string | null }> = ({ label, valor }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{label}</label>
    <div
      style={{
        background:   "#F0F0F0",
        border:       "1px solid #E0E0E0",
        borderRadius: 8,
        padding:      "10px 14px",
        fontSize:     14,
        color:        "#333",
        minHeight:    40,
      }}
    >
      {valor || "—"}
    </div>
  </div>
);

// ─── Campo de formulario ──────────────────────────────────────────────────────

const CampoForm: React.FC<{
  label:       string;
  name:        string;
  value:       string;
  onChange:    (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?:       string;
  placeholder?: string;
}> = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? label}
      className="form-control"
      style={{ borderRadius: 8, fontSize: 14 }}
    />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const InfoPersonal: React.FC = () => {
  const {
    perfil, cargando,
    modalAbierto, form, guardando,
    abrirModal, cerrarModal,
    handleChange, guardarPerfil,
  } = LogicaInfoPersonal();

  return (
    <>
      <PantallaCarga isLoading={cargando} />

      <div className="contenedor-general">
        <div
          style={{
            background:   "#fff",
            borderRadius: 12,
            padding:      "32px 36px",
            boxShadow:    "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          {/* ── Encabezado ───────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <i className="bi bi-person-circle" style={{ fontSize: 32, color: "#333" }} />
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>Información de Usuario</h4>
          </div>

          {/* ── Campos ───────────────────────────────────────────────── */}
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:                 "20px 32px",
            }}
          >
            <CampoLectura label="Nombre"                 valor={perfil?.nombre               ?? null} />
            <CampoLectura label="Nombre de Usuario"      valor={perfil?.usuario               ?? null} />
            <CampoLectura label="Correo"                 valor={perfil?.correo                ?? null} />
            <CampoLectura label="Número de Teléfono"     valor={perfil?.telefono              ?? null} />
            <CampoLectura label="Número Identificación"  valor={perfil?.numero_identificacion ?? null} />
          </div>

          {/* ── Botón ────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button
              className="btn btn-genericos btn-principal"
              style={{ padding: "10px 28px" }}
              onClick={abrirModal}
              disabled={!perfil}
            >
              Editar Información
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal edición ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        title="EDITAR INFORMACIÓN PERSONAL"
        onSave={guardarPerfil}
        txtBoton={guardando ? "Guardando..." : "Guardar"}
        botonClassName="btn-warning text-dark fw-bold px-4"
        disableButton={guardando}
      >
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 "16px 24px",
          }}
        >
          <CampoForm
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
          <CampoForm
            label="Nombre de Usuario"
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
          />
          <CampoForm
            label="Correo"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            type="email"
          />
          <CampoForm
            label="Número de Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />
          <CampoForm
            label="Número Identificación"
            name="numero_identificacion"
            value={form.numero_identificacion}
            onChange={handleChange}
          />
          <CampoForm
            label="Contraseña"
            name="contrasena"
            value={form.contrasena}
            onChange={handleChange}
            type="password"
            placeholder="Nueva contraseña (opcional)"
          />
        </div>
      </Modal>
    </>
  );
};

export default InfoPersonal;
