import React from "react";
import { useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { LogicaVentas } from "./LogicaVentas";
import type { Venta } from "./LogicaVentas";
import "../../../styles/Tablas/tablas.css";
import "../../../styles/Usuarios/HomePage.css";

// ─── Badge de estado ──────────────────────────────────────────────────────────

const EstadoBadge: React.FC<{ nombre: string }> = ({ nombre }) => {
  const lower = nombre.toLowerCase();
  let color = "#6c757d";
  if (lower.includes("despachado"))          color = "#198754";
  else if (lower.includes("pendiente"))   color = "#fd7e14";
  else if (lower.includes("preparando"))  color = "#0d6efd";
  else if (lower.includes("sin contacto")) color = "#dc3545";
  else if (lower.includes("inactivo"))    color = "#555555";
  else if (lower.includes("activo"))      color = "#198754";
  else if (lower.includes("cancelado"))    color = "#dc3545";


  return (
    <span
      style={{
        display:       "inline-block",
        padding:       "3px 10px",
        borderRadius:  "12px",
        fontSize:      "12px",
        fontWeight:    600,
        color:         "#fff",
        backgroundColor: color,
        whiteSpace:    "nowrap",
      }}
    >
      {nombre}
    </span>
  );
};

// ─── Fila de la tabla ─────────────────────────────────────────────────────────

const FilaVenta: React.FC<{
  venta:          Venta;
  editandoPk:     number | null;
  nuevoEstado:    string;
  guardandoPk:    number | null;
  estados:        { pk_estado: number; nombre: string }[];
  onIniciarEdicion: (v: Venta) => void;
  onCancelar:     () => void;
  onGuardar:      (pk: number) => void;
  onNuevoEstado:  (val: string) => void;
  onVerDetalle:   (pkProducto: number) => void;
  formatPrecio:   (v: string | number) => string;
  formatFecha:    (f: string) => string;
}> = ({
  venta, editandoPk, nuevoEstado, guardandoPk, estados,
  onIniciarEdicion, onCancelar, onGuardar, onNuevoEstado,
  onVerDetalle, formatPrecio, formatFecha,
}) => {
  const editando  = editandoPk === venta.pk_venta;
  const guardando = guardandoPk === venta.pk_venta;

  return (
    <tr>
      <td>{venta.pk_venta}</td>
      <td>{venta.cantidad_producto}</td>
      <td>{venta.fecha ? formatFecha(venta.fecha) : "—"}</td>
      <td>{venta.comprador_nombre ?? "—"}</td>
      <td>{venta.comprador_correo ?? "—"}</td>
      <td>{formatPrecio(venta.total_venta)}</td>
      <td>
        {editando ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 150 }}
              value={nuevoEstado}
              onChange={(e) => onNuevoEstado(e.target.value)}
            >
              {estados.map((e) => (
                <option key={e.pk_estado} value={e.pk_estado}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm btn-success"
              onClick={() => onGuardar(venta.pk_venta)}
              disabled={guardando}
              title="Guardar"
            >
              {guardando
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-check-lg" />}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={onCancelar}
              disabled={guardando}
              title="Cancelar"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        ) : (
          <EstadoBadge nombre={venta.estado_nombre ?? "—"} />
        )}
      </td>
      <td>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {!editando && (
            <button
              className="btn btn-sm"
              style={{ color: "#555" }}
              title="Cambiar estado"
              onClick={() => onIniciarEdicion(venta)}
            >
              <i className="bi bi-pencil" />
            </button>
          )}
          <button
            className="btn btn-sm"
            style={{ color: "#555" }}
            title="Ver producto"
            onClick={() => onVerDetalle(venta.pk_producto)}
          >
            <i className="bi bi-eye" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const Ventas: React.FC = () => {
  const navigate = useNavigate();

  const {
    ventas, cargando, estados,
    searchTerm,   setSearchTerm,
    filtroEstado, setFiltroEstado,
    filtroFecha,  setFiltroFecha,
    hayFiltrosActivos, limpiarFiltros,
    editandoPk, nuevoEstado, setNuevoEstado, guardandoPk,
    iniciarEdicion, cancelarEdicion, guardarEstado,
    formatPrecio, formatFecha,
  } = LogicaVentas();

  return (
    <>
      <PantallaCarga isLoading={cargando} />

      <div className="tabla-container">

        {/* ── Filtros ────────────────────────────────────────────────── */}
        <div className="hp-filtros" style={{ marginBottom: 20 }}>

          {/* Búsqueda */}
          <div className="hp-search-wrap">
            <i className="bi bi-search hp-search-icon" />
            <input
              type="text"
              className="hp-input hp-search-input"
              placeholder="Buscar Venta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <button className="hp-clear-search" onClick={() => setSearchTerm("")}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {/* Estado */}
          <div className="hp-precio-grupo">
            <span className="hp-precio-label">Estado</span>
            <select
              className="hp-input hp-select"
              style={{ minWidth: 140 }}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e.pk_estado} value={e.pk_estado}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="hp-precio-grupo">
            <span className="hp-precio-label">Fecha Venta</span>
            <input
              type="date"
              className="hp-input"
              style={{ minWidth: 150 }}
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>

          {hayFiltrosActivos && (
            <button className="hp-btn-limpiar" onClick={limpiarFiltros}>
              <i className="bi bi-x-circle me-1" />Limpiar
            </button>
          )}
        </div>

        {/* ── Tabla ─────────────────────────────────────────────────── */}
        <h5 style={{ fontWeight: 700, marginBottom: 16 }}>LISTADO DE VENTAS</h5>

        {!cargando && ventas.length === 0 ? (
          <div className="hp-empty">
            <i className="bi bi-bag-x hp-empty-icon" />
            <p className="hp-empty-titulo">No tienes ventas registradas</p>
            {hayFiltrosActivos && (
              <button className="hp-btn-limpiar hp-btn-limpiar--center" onClick={limpiarFiltros}>
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="tabla-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Codigo Venta</th>
                  <th>Cantidad Productos</th>
                  <th>Fecha</th>
                  <th>Comprador</th>
                  <th>Correo Comprador</th>
                  <th>Total Venta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <FilaVenta
                    key={v.pk_venta}
                    venta={v}
                    editandoPk={editandoPk}
                    nuevoEstado={nuevoEstado}
                    guardandoPk={guardandoPk}
                    estados={estados}
                    onIniciarEdicion={iniciarEdicion}
                    onCancelar={cancelarEdicion}
                    onGuardar={guardarEstado}
                    onNuevoEstado={setNuevoEstado}
                    onVerDetalle={(pkProducto) => navigate(`/detalle-mi-producto/${pkProducto}`)}
                    formatPrecio={formatPrecio}
                    formatFecha={formatFecha}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Ventas;
