import React from "react";
import { useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { useHomePage } from "./LogicaHomePage";
import type { ProductoCard } from "./LogicaHomePage";
import "../../../styles/Usuarios/HomePage.css";

// ─── Placeholder SVG cuando no hay imagen ────────────────────────────────────
const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'" +
  " viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EFEFEF'/%3E" +
  "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'" +
  " fill='%23BDBDBD' font-size='15' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ─── Subcomponente: tarjeta de producto ──────────────────────────────────────
const ProductoCard: React.FC<{
  producto: ProductoCard;
  formatPrecio: (p: number) => string;
  onClick: (pk: number) => void;
  index: number;
}> = ({ producto, formatPrecio, onClick, index }) => (
  <article
    className="hp-card"
    style={{ animationDelay: `${index * 40}ms` }}
    onClick={() => onClick(producto.pk_producto)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick(producto.pk_producto)}
  >
    <div className="hp-card-img-wrap">
      <img
        src={producto.imagen_url ?? IMG_PLACEHOLDER}
        alt={producto.nombre}
        className="hp-card-img"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER;
        }}
      />
    </div>
    <div className="hp-card-body">
      <p className="hp-card-nombre">{producto.nombre}</p>
      <p className="hp-card-precio">{formatPrecio(producto.precio)}</p>
    </div>
  </article>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const {
    productos,
    cargando,
    searchTerm,
    setSearchTerm,
    minPrecio,
    setMinPrecio,
    maxPrecio,
    setMaxPrecio,
    hayFiltrosActivos,
    limpiarFiltros,
    formatPrecio,
    
  } = useHomePage();

  const irADetalle = (pk: number) => navigate(`/producto/${pk}`);

  
  return (
    <>
      <PantallaCarga isLoading={cargando} />
      <div>

        {/* ═══ Barra de filtros ════════════════════════════════════════════ */}
        <div className="hp-filtros">

          <div className="hp-search-wrap">
            <i className="bi bi-search hp-search-icon" />
            <input
              type="text"
              className="hp-input hp-search-input"
              placeholder="Artículos y Servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <button className="hp-clear-search" onClick={() => setSearchTerm("")} title="Limpiar búsqueda">
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {/* Rango de precios */}
          <div className="hp-precio-grupo">
            <span className="hp-precio-label">Rango Precios</span>
            <div className="hp-precio-inputs">
              <input
                  type="number"
                  className="hp-input hp-input-precio"
                  placeholder="Mín"
                  value={minPrecio}
                  min={0}
                  onChange={(e) => setMinPrecio(e.target.value)}
                />
              <span className="hp-precio-sep">—</span>
              <input
                type="number"
                className="hp-input hp-input-precio"
                placeholder="Máx"
                value={maxPrecio}
                min={0}
                onChange={(e) => setMaxPrecio(e.target.value)}
              />
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hayFiltrosActivos && (
            <button className="hp-btn-limpiar" onClick={limpiarFiltros} title="Limpiar todos los filtros">
              <i className="bi bi-x-circle me-1" />
              Limpiar
            </button>
          )}
        </div>

        {/* ═══ Contador de resultados ══════════════════════════════════════ */}
        {!cargando && (
          <p className="hp-resultados-count">
            {productos.length === 0
              ? "Sin resultados"
              : `${productos.length} producto${productos.length !== 1 ? "s" : ""} encontrado${productos.length !== 1 ? "s" : ""}`}
            {hayFiltrosActivos && <span className="hp-filtro-activo-tag"> · con filtros aplicados</span>}
          </p>
        )}

        {/* ═══ Grid de productos ═══════════════════════════════════════════ */}
        {!cargando && productos.length === 0 ? (
          <div className="hp-empty">
            <i className="bi bi-box-seam hp-empty-icon" />
            <p className="hp-empty-titulo">No se encontraron productos</p>
            {hayFiltrosActivos && (
              <button className="hp-btn-limpiar hp-btn-limpiar--center" onClick={limpiarFiltros}>
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <section className="hp-grid">
            {productos.map((p, i) => (
              <ProductoCard
                key={p.pk_producto}
                producto={p}
                formatPrecio={formatPrecio}
                onClick={irADetalle}
                index={i}
              />
            ))}
          </section>
        )}
      </div>
    </>
  );
};

export default HomePage;