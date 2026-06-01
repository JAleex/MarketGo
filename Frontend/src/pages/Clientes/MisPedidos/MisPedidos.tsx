import React from "react";
import { useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { LogicaMisPedidos } from "./LogicaMisPedidos";
import type { DetallePedido, Pedido } from "./LogicaMisPedidos";
import "../../../styles/Tablas/tablas.css";
import "../../../styles/Usuarios/HomePage.css";

// ─── Placeholder ──────────────────────────────────────────────────────────────

const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'" +
  " viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23EFEFEF'/%3E" +
  "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'" +
  " fill='%23BDBDBD' font-size='13' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ─── Badge estado ─────────────────────────────────────────────────────────────

const EstadoBadge: React.FC<{ nombre: string }> = ({ nombre }) => {
  const lower = nombre.toLowerCase();
  let color = "#6c757d";
  if (lower.includes("pendiente"))        color = "#fd7e14";
  else if (lower.includes("completado"))  color = "#198754";
  else if (lower.includes("cancelado"))   color = "#dc3545";
  else if (lower.includes("activo"))      color = "#198754";
  else if (lower.includes("inactivo"))    color = "#555555";

  return (
    <span
      style={{
        display:         "inline-block",
        padding:         "3px 10px",
        borderRadius:    "12px",
        fontSize:        "12px",
        fontWeight:      600,
        color:           "#fff",
        backgroundColor: color,
        whiteSpace:      "nowrap",
      }}
    >
      {nombre}
    </span>
  );
};

// ─── Tarjeta de producto en el modal ─────────────────────────────────────────

const TarjetaDetalle: React.FC<{
  item:         DetallePedido;
  formatPrecio: (v: string | number) => string;
  onClickProducto: (pk: number) => void;
}> = ({ item, formatPrecio, onClickProducto }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onClickProducto(item.pk_producto)}
    onKeyDown={(e) => e.key === "Enter" && onClickProducto(item.pk_producto)}
    style={{
      display:       "flex",
      alignItems:    "center",
      gap:           16,
      padding:       "14px 16px",
      borderRadius:  12,
      border:        "1px solid #EFEFEF",
      cursor:        "pointer",
      transition:    "background 0.15s, box-shadow 0.15s",
      background:    "#fff",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.background = "#fff";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
  >
    {/* Imagen */}
    <div
      style={{
        width:        72,
        height:       72,
        flexShrink:   0,
        borderRadius: 10,
        overflow:     "hidden",
        background:   "#EFEFEF",
        border:       "1px solid #E8E8E8",
      }}
    >
      <img
        src={item.imagen_url ?? IMG_PLACEHOLDER}
        alt={item.producto_nombre}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER; }}
      />
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.producto_nombre}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
        {item.cantidad_producto} x {formatPrecio(item.producto_precio)}
      </p>
    </div>

    {/* Subtotal */}
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111" }}>
        {formatPrecio(item.total_pedido)}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#AAAAAA" }}>Ver producto →</p>
    </div>
  </div>
);

// ─── Modal de detalle ─────────────────────────────────────────────────────────

const ModalDetalle: React.FC<{
  pedido:          Pedido;
  detalles:        DetallePedido[];
  cargando:        boolean;
  onClose:         () => void;
  formatPrecio:    (v: string | number) => string;
  formatFecha:     (f: string) => string;
  onClickProducto: (pk: number) => void;
}> = ({ pedido, detalles, cargando, onClose, formatPrecio, formatFecha, onClickProducto }) => (
  <div
    style={{
      position:        "fixed",
      inset:           0,
      backgroundColor: "rgba(0,0,0,0.45)",
      backdropFilter:  "blur(3px)",
      zIndex:          1050,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         16,
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div
      style={{
        background:   "#fff",
        borderRadius: 16,
        width:        "100%",
        maxWidth:     620,
        maxHeight:    "90vh",
        overflowY:    "auto",
        padding:      "28px 28px 24px",
        boxShadow:    "0 8px 32px rgba(0,0,0,0.18)",
        position:     "relative",
      }}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        style={{
          position:   "absolute",
          top:        16,
          right:      16,
          background: "none",
          border:     "none",
          fontSize:   20,
          cursor:     "pointer",
          color:      "#555",
          lineHeight: 1,
        }}
        title="Cerrar"
      >
        <i className="bi bi-x-lg" />
      </button>

      {/* Encabezado */}
      <h5 style={{ fontWeight: 700, margin: "0 0 4px" }}>Detalle del Pedido #{pedido.pk_pedido}</h5>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>
        {formatFecha(pedido.fecha_pedido)} · {pedido.cantidad_productos} producto(s)
      </p>

      <hr style={{ margin: "0 0 20px", borderColor: "#EFEFEF" }} />

      {/* Productos */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="spinner-border text-secondary" />
        </div>
      ) : detalles.length === 0 ? (
        <p style={{ textAlign: "center", color: "#AAAAAA", padding: "40px 0" }}>
          Sin productos en este pedido
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {detalles.map((d) => (
            <TarjetaDetalle
              key={d.pk_detalle_pedido}
              item={d}
              formatPrecio={formatPrecio}
              onClickProducto={onClickProducto}
            />
          ))}
        </div>
      )}

      {/* Total */}
      {!cargando && detalles.length > 0 && (
        <>
          <hr style={{ margin: "20px 0 14px", borderColor: "#EFEFEF" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Total del pedido</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{formatPrecio(pedido.total_pedido)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "#888" }}>Estado</span>
            <EstadoBadge nombre={pedido.estado_nombre} />
          </div>
        </>
      )}
    </div>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const MisPedidos: React.FC = () => {
  const navigate = useNavigate();

  const {
    pedidos, cargando, estados,
    searchTerm,   setSearchTerm,
    filtroEstado, setFiltroEstado,
    filtroFecha,  setFiltroFecha,
    hayFiltrosActivos, limpiarFiltros,
    modalAbierto, pedidoSeleccionado, detalles, cargandoDetalle,
    abrirDetalle, cerrarModal,
    formatPrecio, formatFecha,
  } = LogicaMisPedidos();

  const irAProducto = (pk: number) => {
    cerrarModal();
    navigate(`/producto/${pk}`);
  };

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
              placeholder="Buscar Pedido"
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
            <span className="hp-precio-label">Fecha Pedido</span>
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

        <h5 style={{ fontWeight: 700, marginBottom: 16 }}>MIS PEDIDOS</h5>

        {!cargando && pedidos.length === 0 ? (
          <div className="hp-empty">
            <i className="bi bi-bag hp-empty-icon" />
            <p className="hp-empty-titulo">No tienes pedidos registrados</p>
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
                  <th>Código Pedido</th>
                  <th>Cantidad Productos</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.pk_pedido}>
                    <td>{p.pk_pedido}</td>
                    <td>{p.cantidad_productos}</td>
                    <td>{formatFecha(p.fecha_pedido)}</td>
                    <td>{formatPrecio(p.total_pedido)}</td>
                    <td><EstadoBadge nombre={p.estado_nombre} /></td>
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{ color: "#555" }}
                        title="Ver detalle"
                        onClick={() => abrirDetalle(p)}
                      >
                        <i className="bi bi-eye" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de detalle ─────────────────────────────────────── */}
      {modalAbierto && pedidoSeleccionado && (
        <ModalDetalle
          pedido={pedidoSeleccionado}
          detalles={detalles}
          cargando={cargandoDetalle}
          onClose={cerrarModal}
          formatPrecio={formatPrecio}
          formatFecha={formatFecha}
          onClickProducto={irAProducto}
        />
      )}
    </>
  );
};

export default MisPedidos;
