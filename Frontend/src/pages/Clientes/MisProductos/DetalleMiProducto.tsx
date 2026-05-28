import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import Modal from "../../../components/Modales/Modal";
import { LogicaMisProductos } from "../MisProductos/LogicaMisProductos";
import { LogicaDetalleMiProducto } from "./LogicaDetalleMiProducto";
import type { ProductoDetalle } from "../MisProductos/LogicaMisProductos";
import "../../../styles/Usuarios/HomePage.css";
import "../../../styles/Usuarios/MisProductos.css";

const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'" +
  " viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23EFEFEF'/%3E" +
  "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'" +
  " fill='%23BDBDBD' font-size='16' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

const DetalleMiProducto: React.FC = () => {
  const { pk } = useParams<{ pk: string }>();
  const navigate = useNavigate();

  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  const { cargarDetalleProducto, formatPrecio, formatFecha } = LogicaMisProductos();

  const {
    isModalOpen,
    abrirModalEditar,
    cerrarModal,
    form,
    errores,
    guardando,
    imagenPreview,
    fileInputRef,
    handleInputChange,
    handleImagenChange,
    quitarImagen,
    handleGuardarEdicion,
  } = LogicaDetalleMiProducto();

  // ── Carga inicial ──────────────────────────────────────────────────────────

  const cargar = async () => {
    if (!pk) return;
    setCargando(true);
    const data = await cargarDetalleProducto(Number(pk));
    setProducto(data);
    setCargando(false);
  };

  useEffect(() => { void cargar(); }, [pk]);

  // ── Guardar y recargar detalle ─────────────────────────────────────────────

  const handleGuardar = async () => {
    const ok = await handleGuardarEdicion();
    if (ok) void cargar();   // recarga el detalle con los datos nuevos
  };

  const hayContacto =
    producto?.nombre_vendedor ||
    producto?.telefono_vendedor ||
    producto?.correo_vendedor;

  return (
    <>
      <PantallaCarga isLoading={cargando || guardando} />

      {/* input file oculto — debe estar fuera del Modal para que el ref funcione */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImagenChange}
      />

      <div>

        {/* Botón volver */}
        <button className="hp-back-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2" />
          Volver
        </button>

        {!cargando && !producto && (
          <div className="hp-empty">
            <i className="bi bi-exclamation-circle hp-empty-icon" />
            <p className="hp-empty-titulo">Producto no disponible</p>
            <button
              className="hp-btn-limpiar hp-btn-limpiar--center"
              onClick={() => navigate(-1)}
            >
              Volver
            </button>
          </div>
        )}

        {!cargando && producto && (
          <div className="hp-detalle-wrap">

            {/* Imagen */}
            <div className="hp-detalle-img-col">
              <div className="hp-detalle-img-frame">
                <img
                  src={producto.imagen_url ?? IMG_PLACEHOLDER}
                  alt={producto.nombre}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER;
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="hp-detalle-info-col">
              <h1 className="hp-detalle-nombre">{producto.nombre}</h1>
              <p className="hp-detalle-precio">{formatPrecio(producto.precio)}</p>
              <p className="hp-detalle-fecha">
                Fecha de Publicación: {formatFecha(producto.fecha_publicacion)}
              </p>

              {producto.detalles && (
                <div className="hp-detalle-seccion">
                  <h3 className="hp-detalle-seccion-titulo">Detalles</h3>
                  <p className="hp-detalle-seccion-texto">{producto.detalles}</p>
                </div>
              )}

              <div className="hp-detalle-dos-col">
                <div className="hp-detalle-seccion">
                  <h3 className="hp-detalle-seccion-titulo">Estado</h3>
                  <p className="hp-detalle-seccion-texto">{producto.estado}</p>
                </div>
                <div className="hp-detalle-seccion">
                  <h3 className="hp-detalle-seccion-titulo">Stock Disponible</h3>
                  <p className="hp-detalle-seccion-texto">{producto.stock ?? "—"} Unidades</p>
                </div>
              </div>

              {hayContacto && (
                <div className="hp-detalle-seccion">
                  <h3 className="hp-detalle-seccion-titulo">Contacto</h3>
                  <div className="hp-contacto-grid">
                    {producto.telefono_vendedor && (
                      <>
                        <span className="hp-contacto-label">Teléfono:</span>
                        <span className="hp-contacto-valor">{producto.telefono_vendedor}</span>
                      </>
                    )}
                    {producto.nombre_vendedor && (
                      <>
                        <span className="hp-contacto-label">Nombre:</span>
                        <span className="hp-contacto-valor">{producto.nombre_vendedor}</span>
                      </>
                    )}
                    {producto.correo_vendedor && (
                      <>
                        <span className="hp-contacto-label">Correo:</span>
                        <span className="hp-contacto-valor">{producto.correo_vendedor}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botón editar */}
              <button
                className="btn btn-principal"
                onClick={() => abrirModalEditar(producto)}
              >
                <i className="bi bi-pencil me-2" />
                Editar Producto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Modal Editar Producto ══════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title="EDITAR PRODUCTO"
        txtBoton="Guardar Cambios"
        botonClassName="btn-amarillo"
        onSave={handleGuardar}
        disableButton={guardando}
      >
        <div className="mp-form">

          {/* Fila 1: Código · Nombre · Precio */}
          <div className="mp-row-3">

            <div className="mp-field">
              <label className="mp-label">Código Producto</label>
              <input
                name="codigo_producto"
                type="text"
                autoComplete="off"
                className={`mp-input ${errores.codigo_producto ? "mp-input--error" : ""}`}
                value={form.codigo_producto}
                onChange={handleInputChange}
              />
              {errores.codigo_producto && (
                <span className="mp-error">{errores.codigo_producto}</span>
              )}
            </div>

            <div className="mp-field">
              <label className="mp-label">Nombre Producto</label>
              <input
                name="nombre"
                type="text"
                autoComplete="off"
                className={`mp-input ${errores.nombre ? "mp-input--error" : ""}`}
                value={form.nombre}
                onChange={handleInputChange}
              />
              {errores.nombre && (
                <span className="mp-error">{errores.nombre}</span>
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
                  className={`mp-input mp-input-precio ${errores.precio ? "mp-input--error" : ""}`}
                  value={form.precio}
                  onChange={handleInputChange}
                />
              </div>
              {errores.precio && (
                <span className="mp-error">{errores.precio}</span>
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
              onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                className={`mp-input ${errores.stock ? "mp-input--error" : ""}`}
                value={form.stock}
                onChange={handleInputChange}
              />
              {errores.stock && (
                <span className="mp-error">{errores.stock}</span>
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
                  <span className="mp-imagen-placeholder">imagen.png</span>
                  <i className="bi bi-image mp-imagen-icon" />
                </>
              )}
            </div>
            {imagenPreview && (
              <button type="button" className="mp-imagen-quitar" onClick={quitarImagen}>
                <i className="bi bi-x me-1" />Quitar imagen
              </button>
            )}
          </div>

          <div className="mp-contacto">
            <p className="mp-contacto-titulo">Información de Contacto</p>
            <div className="mp-checks">
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_telefono"
                  checked={form.muestra_telefono}
                  onChange={handleInputChange}
                />
                <span>Mostrar Teléfono</span>
              </label>
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_nombre"
                  checked={form.muestra_nombre}
                  onChange={handleInputChange}
                />
                <span>Mostrar Nombre</span>
              </label>
              <label className="mp-check-label">
                <input
                  type="checkbox"
                  name="muestra_correo"
                  checked={form.muestra_correo}
                  onChange={handleInputChange}
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

export default DetalleMiProducto;