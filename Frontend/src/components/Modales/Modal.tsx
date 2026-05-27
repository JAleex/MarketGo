import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  children?: React.ReactNode;
  txtBoton: string;
  showCloseButton?: boolean;
  botonClassName?: string; 
  disableButton?: boolean; 
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  onSave, 
  children, 
  txtBoton, 
  showCloseButton = true,
  botonClassName = "btn-primary",
  disableButton = false, 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fondo-blur d-flex justify-content-center align-items-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1050,
      }}
    >
      <div
        className="contenedor-modal p-4 rounded-3 shadow bg-white"
        style={{
          position: "fixed",
          width: "100%",
          maxWidth: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="contenido-modal">
          {showCloseButton && (
            <div className="btn-equis-cerrar text-end">
              <button className="btn btn-danger" onClick={onClose}>
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
          )}

          <div className="titulo-modal text-center">
            <h2 className="text-xl fw-bold mb-3">{title}</h2>
            <hr />
          </div>

          <div className="mb-4">{children}</div>

          <div className="text-center">
            <button
              className={`btn ${botonClassName}`}
              onClick={onSave}
              disabled={disableButton}
            >
              {txtBoton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
