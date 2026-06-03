import React from "react";
import { useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import Modal from "../../../components/Modales/Modal";
import { LogicaMisProductos } from "./LogicaMisProductos";
import type { ProductoCard } from "./LogicaMisProductos";
import "../../../styles/Usuarios/HomePage.css";

// ─── Placeholder ──────────────────────────────────────────────────────────────
const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'" +
  " viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EFEFEF'/%3E" +
  "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'" +
  " fill='%23BDBDBD' font-size='15' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ─── Tarjeta ──────────────────────────────────────────────────────────────────
const ProductoCardItem: React.FC<{
  producto: ProductoCard;
  formatPrecio: (p: number) => string;
  onClick: (pk: number) => void;
  onToggleEstado: (producto: ProductoCard) => void;
  index: number;
}> = ({ producto, formatPrecio, onClick, onToggleEstado, index }) => (
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
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER; }}
      />
    </div>
    <div className="hp-card-body">
      <p className="hp-card-nombre">{producto.nombre}</p>
      <p className="hp-card-precio">{formatPrecio(producto.precio)}</p>
      <div className="hp-card-footer">
        <span className={`estado-texto ${producto.fk_estado === 1 ? "activo" : "inactivo"}`}>
          {producto.estado}
        </span>
        <button
          type="button"
          className="toggle-estado-btn"
          onClick={(e) => { e.stopPropagation(); onToggleEstado(producto); }}
        >
          <i className={`bi ${producto.fk_estado === 1 ? "bi-toggle-on" : "bi-toggle-off"}`} />
        </button>
      </div>
    </div>
  </article>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const MisProductos: React.FC = () => {
  const navigate = useNavigate();

  const {
    productos, cargando,
    searchTerm, setSearchTerm,
    hayFiltrosActivos, limpiarFiltros,
    handleToggleEstado,
    formatPrecio,
    // modal crear
    isModalOpen, abrirModalCrear, cerrarModal,
    form, erroresForm, guardando,
    imagenPreview, setImagenFile, fileInputRef,
    handleFormChange, handleImagenChange, handleCrearProducto,
  } = LogicaMisProductos();

  const irADetalle = (pk: number) => navigate(`/detalle-mi-producto/${pk}`);

  return (
    <>
      <PantallaCarga isLoading={cargando || guardando} />

      <div>
        {/* ══ Barra de filtros ════════════════════════════════════════════ */}
        <div className="hp-filtros">

          {/* Búsqueda */}
          <div className="hp-search-wrap">
            <i className="bi bi-search hp-search-icon" />
            <input
              type="text"
              className="hp-input hp-search-input"
              placeholder="Buscar producto..."
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

          {/* Estado (select simple) */}
          <div className="hp-precio-grupo">
            <span className="hp-precio-label">Estado</span>
            <select className="hp-input hp-select" style={{ minWidth: 120 }}>
              <option value="">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Limpiar */}
          {hayFiltrosActivos && (
            <button className="hp-btn-limpiar" onClick={limpiarFiltros}>
              <i className="bi bi-x-circle me-1" />Limpiar
            </button>
          )}

          {/* Agregar */}
          <div className="ms-auto">
            <button className="btn btn-principal" onClick={abrirModalCrear}>
              <i className="bi bi-plus me-1" />Agregar Producto
            </button>
          </div>
        </div>

        {/* ══ Contador ════════════════════════════════════════════════════ */}
        {!cargando && (
          <p className="hp-resultados-count">
            {productos.length === 0 ? "Sin resultados"
              : `${productos.length} producto${productos.length !== 1 ? "s" : ""}`}
            {hayFiltrosActivos && (
              <span className="hp-filtro-activo-tag"> · con filtros aplicados</span>
            )}
          </p>
        )}

        {/* ══ Grid ════════════════════════════════════════════════════════ */}
        {!cargando && productos.length === 0 ? (
          <div className="hp-empty">
            <i className="bi bi-box-seam hp-empty-icon" />
            <p className="hp-empty-titulo">No tienes productos publicados</p>
            {hayFiltrosActivos && (
              <button className="hp-btn-limpiar hp-btn-limpiar--center" onClick={limpiarFiltros}>
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <section className="hp-grid">
            {productos.map((p, i) => (
              <ProductoCardItem
                key={p.pk_producto}
                producto={p}
                formatPrecio={formatPrecio}
                onClick={irADetalle}
                onToggleEstado={handleToggleEstado}
                index={i}
              />
            ))}
          </section>
        )}
      </div>

      {/* ══ Modal: Agregar Producto ══════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title="AGREGAR PRODUCTO"
        txtBoton="Guardar"
        botonClassName="btn-amarillo"
        onSave={handleCrearProducto}
        disableButton={guardando}
      >
        {/* input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImagenChange}
        />

        <div className="mp-form">

          {/* Fila 1: Código · Nombre · Precio */}
          <div className="mp-row-3">
            <div className="mp-field">
              <label className="mp-label">Código Producto</label>
              <input
                name="codigo_producto"
                type="text"
                autoComplete="off"
                className={`mp-input ${erroresForm.codigo_producto ? "mp-input--error" : ""}`}
                value={form.codigo_producto}
                onChange={handleFormChange}
                placeholder="PROD-001"
              />
              {erroresForm.codigo_producto && (
                <span className="mp-error">{erroresForm.codigo_producto}</span>
              )}
            </div>

            <div className="mp-field">
              <label className="mp-label">Nombre Producto</label>
              <input
                name="nombre"
                type="text"
                autoComplete="off"
                className={`mp-input ${erroresForm.nombre ? "mp-input--error" : ""}`}
                value={form.nombre}
                onChange={handleFormChange}
                placeholder="Ej: Camiseta"
              />
              {erroresForm.nombre && (
                <span className="mp-error">{erroresForm.nombre}</span>
              )}
            </div>

            <div className="mp-field">
              <label className="mp-label">Valor Producto (Unidad)</label>
              <div className="mp-precio-wrap">
                <span className="mp-precio-signo">$</span>
                <input
                  name="precio"
                  type="number"
                  min="0"
                  className={`mp-input mp-input-precio ${erroresForm.precio ? "mp-input--error" : ""}`}
                  value={form.precio}
                  onChange={handleFormChange}
                  placeholder="0"
                />
              </div>
              {erroresForm.precio && (
                <span className="mp-error">{erroresForm.precio}</span>
              )}
            </div>
          </div>

          {/* Fila 2: Descripción */}
          <div className="mp-field">
            <label className="mp-label">Descripción Producto</label>
            <textarea
              name="detalles"
              rows={3}
              className="mp-input mp-textarea"
              value={form.detalles}
              onChange={handleFormChange}
              placeholder="Describe el producto..."
            />
          </div>

          {/* Fila 3: Estado · Stock */}
          <div className="mp-row-2">
            <div className="mp-field">
              <label className="mp-label">Estado</label>
              <select
                name="fk_estado"
                className="mp-input mp-select"
                value={form.fk_estado}
                onChange={handleFormChange}
              >
                <option value={1}>Activo</option>
                <option value={2}>Inactivo</option>
              </select>
            </div>

            <div className="mp-field">
              <label className="mp-label">Stock Disponible (Unidades)</label>
              <input
                name="stock"
                type="number"
                min="0"
                className={`mp-input ${erroresForm.stock ? "mp-input--error" : ""}`}
                value={form.stock}
                onChange={handleFormChange}
                placeholder="0"
              />
              {erroresForm.stock && (
                <span className="mp-error">{erroresForm.stock}</span>
              )}
            </div>
          </div>

          {/* Fila 4: Imagen */}
          <div className="mp-field">
            <label className="mp-label">Adjuntar Imagen</label>
            <div
              className="mp-imagen-upload"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              {imagenPreview ? (
                <img src={imagenPreview} alt="Preview" className="mp-imagen-preview" />
              ) : (
                <>
                  <span className="mp-imagen-placeholder">
                    {form.codigo_producto
                      ? `${form.codigo_producto}.png`
                      : "imagen.png"}
                  </span>
                  <i className="bi bi-image mp-imagen-icon" />
                </>
              )}
            </div>
            {imagenPreview && (
              <button
                type="button"
                className="mp-imagen-quitar"
                onClick={() => {
                  setImagenFile(null);   
                  // limpiamos el preview directo desde el hook
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <i className="bi bi-x me-1" />Quitar imagen
              </button>
            )}
          </div>

          {/* Fila 5: Información de Contacto */}
          <div className="mp-contacto">
            <p className="mp-contacto-titulo">Información de Contacto</p>
            <div className="mp-checks">
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_telefono"
                  checked={form.muestra_telefono}
                  onChange={handleFormChange}
                />
                <span>Mostrar Teléfono</span>
              </label>
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_nombre"
                  checked={form.muestra_nombre}
                  onChange={handleFormChange}
                />
                <span>Mostrar Nombre</span>
              </label>
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_correo"
                  checked={form.muestra_correo}
                  onChange={handleFormChange}
                />
                <span>Mostrar Correo</span>
              </label>
            </div>
          </div>

        </div>
      </Modal>
    </>
  );
};

export default MisProductos;