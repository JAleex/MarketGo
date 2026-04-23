import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alerts } from "../Alertas/alertas";
import "../../styles/HeaderAndNavbar/Navbar.css";

interface NavbarProps {
  isNavbarVisible: boolean;
  toggleNavbar: () => void;
}

const ICONS = {
  MENU: "bi-list",
  LOGOUT: "bi-box-arrow-left",
  USER: "bi-person-workspace",
  ARROW: "bi-chevron-right",
  DEFAULT: "bi-circle",
} as const;

const STORAGE_KEYS = {
  NAVBAR_STATE: "navbarState",
} as const;

const Navbar: React.FC<NavbarProps> = ({ isNavbarVisible, toggleNavbar }) => {
  const location = useLocation();
  const { logout, user, vistas, loading } = useAuth();

  const [navbarVisible, setNavbarVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NAVBAR_STATE);
    return saved !== null ? JSON.parse(saved) : isNavbarVisible;
  });

  const handleToggle = useCallback(() => {
    setNavbarVisible(prev => !prev);
    toggleNavbar();
  }, [toggleNavbar]);

  const handleLogout = useCallback(async () => {
    const result = await Alerts.confirm("¿Desea salir del sistema?", {
      title: "Cerrar Sesión",
      confirmText: "Sí, salir",
    });
    if (result.isConfirmed) await logout();
  }, [logout]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NAVBAR_STATE, JSON.stringify(navbarVisible));
  }, [navbarVisible]);

  useEffect(() => {
    if (navbarVisible !== isNavbarVisible) toggleNavbar();
  }, []);

  // GENERAR MENÚ DINÁMICO DESDE PERMISOS DEL ROL
  const navItems = useMemo(() => {
    if (loading || vistas.length === 0) return null;
    
    return vistas
      .filter(v => v.tiene_acceso) //SOLO PERMISOS ACTIVOS
      .map(v => {
        const rutaBase = v.ruta_vista;
        const isActive = location.pathname.startsWith(rutaBase);

        return (
          <li key={v.pk_permiso_rol} className={`nav-item ${isActive ? "active" : ""}`}>
            <Link className="nav-link" to={rutaBase}>
               <i className={`bi ${v.icono || ICONS.DEFAULT}`}></i>
              <span className={`nav-text ${isNavbarVisible ? "visible" : "hidden"}`}>
                {v.nombre_vista}
                <i className={`bi ${ICONS.ARROW} nav-arrow`}></i>
              </span>
            </Link>
          </li>
        );
      });
  }, [vistas, location.pathname, isNavbarVisible, loading]);

  if (loading || vistas.length === 0) {
    return null;
  }

  return (
    <nav className={`navbar ${isNavbarVisible ? "visible" : "hidden"}`}>
      <p className="menu-button" onClick={handleToggle}>
        <i className={`bi ${ICONS.MENU}`}></i>
      </p>

      <div className="navbar-content">
        {isNavbarVisible && (
          <div className="navbar-logo">
            <img
              src={`${import.meta.env.BASE_URL}Imagenes/Logo_regis_NEGRO.png`}
              alt="Logo"
              className="logo-img"
            />
            <hr className="navbar-divider" />

            {user && (
              <>
                <div className="user-info visible">
                  <p>
                    <i className={`bi ${ICONS.USER}`}></i> {user.usuario}
                  </p>
                </div>
                <hr className="navbar-divider-bottom" />
              </>
            )}
          </div>
        )}

        <ul className="navbar-nav">
          {navItems}

          {isNavbarVisible && vistas.length > 0 && (
            <hr className="divider-service" />
          )}

          <li className="nav-item">
            <button type="button" className="nav-link" onClick={handleLogout}>
              <i className={`bi ${ICONS.LOGOUT}`}></i>
              <span className={`nav-text ${isNavbarVisible ? "visible" : "hidden"}`}>
                Salir
              </span>
            </button>
          </li>
        </ul>

        <div className={`version-text ${isNavbarVisible ? "visible" : "hidden"}`}>
          v1.0.0
        </div>
      </div>
    </nav>
  );
};

export default Navbar;