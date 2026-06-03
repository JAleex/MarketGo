import React from "react";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { LogicaCarrito } from "./LogicaCarrito";
import type { CarritoItem } from "./LogicaCarrito";
import "../../../styles/Carrito/Carrito.css";

// ─── Placeholder ──────────────────────────────────────────────────────────────
const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'" +
  " viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23E8E8E8'/%3E" +
  "%3Crect x='15' y='15' width='50' height='50' rx='4' fill='none' stroke='%23BDBDBD' stroke-width='2'/%3E" +
  "%3Cline x1='15' y1='15' x2='65' y2='65' stroke='%23BDBDBD' stroke-width='1.5'/%3E" +
  "%3Cline x1='65' y1='15' x2='15' y2='65' stroke='%23BDBDBD' stroke-width='1.5'/%3E%3C/svg%3E";

// ─── Subcomponente: fila de producto ─────────────────────────────────────────
const FilaProducto: React.FC<{
  item: CarritoItem;
  formatPrecio: (p: number) => string;
  onCantidad: (pk: number, nueva: number) => void;
  onEliminar: (pk: number) => void;
}> = ({ item, formatPrecio, onCantidad, onEliminar }) => (
  <div className="carr-item">
    {/* Imagen */}
    <div className="carr-item-img">
      <img
        src={item.imagen_url ?? IMG_PLACEHOLDER}
        alt={item.producto_nombre}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER; }}
      />
    </div>

    {/* Info + controles */}
    <div className="carr-item-info">
      <div className="carr-item-top">
        <span className="carr-item-nombre">{item.producto_nombre}</span>
        <button
          className="carr-item-delete"
          onClick={() => onEliminar(item.pk_carrito)}
          title="Eliminar del carrito"
        >
          <i className="bi bi-trash3-fill" />
        </button>
        <span className="carr-item-precio">{formatPrecio(item.subtotal)}</span>
      </div>

      {/* Contador */}
      <div className="carr-item-counter">
        <button
          className="carr-counter-btn"
          onClick={() => onCantidad(item.pk_carrito, item.cantidad_producto - 1)}
          title="Disminuir"
        >
          <i className="bi bi-dash" />
        </button>
        <span className="carr-counter-val">{item.cantidad_producto}</span>
        <button
          className="carr-counter-btn"
          onClick={() => onCantidad(item.pk_carrito, item.cantidad_producto + 1)}
          title="Aumentar"
        >
          <i className="bi bi-plus" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const Carrito: React.FC = () => {
  const {
    resumen,
    gruposPorVendedor,
    cargando,
    procesando,
    actualizarCantidad,
    eliminarItem,
    realizarPedido,
    formatPrecio,
  } = LogicaCarrito();

  const carritoVacio = resumen.items.length === 0;

  return (
    <>
      <PantallaCarga isLoading={cargando || procesando} />

      <div className="carr-layout">

        {/* ══ Columna izquierda: lista de productos ══════════════════════ */}
        <div className="carr-lista">

          {carritoVacio && !cargando ? (
            <div className="carr-empty">
              <i className="bi bi-cart-x carr-empty-icon" />
              <p className="carr-empty-titulo">Tu carrito está vacío</p>
              <p className="carr-empty-sub">Agrega productos desde el inicio para verlos aquí</p>
            </div>
          ) : (
            gruposPorVendedor.map((grupo) => (
              <div className="carr-grupo" key={grupo.vendedor}>
                {/* Encabezado del vendedor */}
                <div className="carr-grupo-header">
                  <i className="bi bi-person-circle me-2" />
                  Producto de: <strong className="ms-1">{grupo.vendedor}</strong>
                </div>

                {/* Ítems del vendedor */}
                <div className="carr-grupo-items">
                  {grupo.items.map((item) => (
                    <FilaProducto
                      key={item.pk_carrito}
                      item={item}
                      formatPrecio={formatPrecio}
                      onCantidad={actualizarCantidad}
                      onEliminar={eliminarItem}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ══ Columna derecha: resumen ════════════════════════════════════ */}
        <aside className="carr-resumen">
          <div className="carr-resumen-card">
            <h3 className="carr-resumen-titulo">Resumen de Pedido</h3>
            <hr className="carr-resumen-hr" />

            <div className="carr-resumen-fila">
              <span>Total Productos:</span>
              <strong>{formatPrecio(resumen.total_precio)}</strong>
            </div>

            <button
              className="carr-btn-pedido"
              onClick={realizarPedido}
              disabled={carritoVacio || procesando}
            >
              {procesando ? (
                <>
                  <span className="carr-spinner" />
                  Procesando...
                </>
              ) : (
                "Realizar Pedido"
              )}
            </button>

            {!carritoVacio && (
              <p className="carr-resumen-hint">
                {resumen.total_productos} producto{resumen.total_productos !== 1 ? "s" : ""} en tu carrito
              </p>
            )}
          </div>
        </aside>

      </div>
    </>
  );
};

export default Carrito;