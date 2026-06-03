import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga";
import { useHomePage } from "../HomePage/LogicaHomePage";
import type { ProductoDetalle } from "../HomePage/LogicaHomePage";
import "../../../styles/Usuarios/HomePage.css";

const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'" +
  " viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23EFEFEF'/%3E" +
  "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'" +
  " fill='%23BDBDBD' font-size='16' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

const DetalleProductoCliente: React.FC = () => {
  const { pk } = useParams<{ pk: string }>();
  const navigate = useNavigate();

  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  const { cargarDetalleProducto, formatPrecio, formatFecha, agregarCarrito } = useHomePage();

  useEffect(() => {
    if (!pk) return;
    setCargando(true);
    cargarDetalleProducto(Number(pk)).then((data) => {
      setProducto(data);
      setCargando(false);
    });
  }, [pk]);

  const hayContacto =
    producto?.nombre_vendedor ||
    producto?.telefono_vendedor ||
    producto?.correo_vendedor;

  return (
    <>
      <PantallaCarga isLoading={cargando} />
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
            <button className="hp-btn-limpiar hp-btn-limpiar--center" onClick={() => navigate("/")}>
              Ir al inicio
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

              <div className="hp-detalle-seccion">
                <h3 className="hp-detalle-seccion-titulo">Estado</h3>
                <p className="hp-detalle-seccion-texto">{producto.estado}</p>
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

              {/* Botón agregar al carrito (preparado para la siguiente fase) */}
              <button
                className="hp-btn-carrito"
                onClick={() => {
                  agregarCarrito(producto.pk_producto)
                }}
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetalleProductoCliente;