import React, { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PantallaCarga from "../../components/PantallaCarga/PantallaCarga";
import { Alerts } from "../Alertas/alertas";
import "../../styles/Permisos/rutas.css";

interface ProtectedRouteProps {
  children: ReactNode;
  ruta?: string; 
}

const RutasProtegidas: React.FC<ProtectedRouteProps> = ({ children, ruta }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  const [accesoValidado, setAccesoValidado] = useState<boolean | null>(null);
  const alertaMostradaRef = useRef(false);

  const rutaActual = ruta || location.pathname;

  if (location.pathname === "/login") {
    return <>{children}</>;
  }

  useEffect(() => {
    alertaMostradaRef.current = false;

    if (loading) {
      setAccesoValidado(null);
      return;
    }

    if (!isAuthenticated) {
      setAccesoValidado(false);
      return;
    }

    const tieneAcceso = hasPermission(rutaActual);

    if (tieneAcceso) {
      setAccesoValidado(true);
    } else {
      setAccesoValidado(false);

      if (!alertaMostradaRef.current) {
        alertaMostradaRef.current = true;

        void Alerts.warning(
          "No tienes permisos para acceder a esta sección.",
          "Acceso denegado"
        );
      }
    }

  }, [isAuthenticated, loading, rutaActual, hasPermission]);

  if (loading || accesoValidado === null) {
    return <PantallaCarga isLoading={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!accesoValidado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RutasProtegidas;