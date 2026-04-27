import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Usuarios/Login/Login";
import Registro from "./pages/Usuarios/Registro/Registro";
import "bootstrap/dist/css/bootstrap.min.css";
import RutasProtegidas from "./components/Permisos/RutasProtegidas";
import PermisosAdmin from "./pages/Administrador/Permisos/PermisosAdmin";
import HomePage from "./pages/Clientes/HomePage/HomePage";
import LayoutPrincipal from "./components/LayoutPrincipal/LayoutPrincipal";

const rutas: Record<string, React.ComponentType> = {
  "/accesos": PermisosAdmin,
  "/inicio": HomePage,

};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route
            element={
              <RutasProtegidas>
                <LayoutPrincipal />
              </RutasProtegidas>
            }
          >
            {Object.entries(rutas).map(([path, Component]) => (
              <Route
                key={path}
                path={path}
                element={<Component />}
              />
            ))}
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;