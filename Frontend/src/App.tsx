import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Usuarios/Login/Login";
import Registro from "./pages/Usuarios/Registro/Registro";
import Usuarios from "./pages/Administrador/Usuarios/UsuariosAdmin";
import "bootstrap/dist/css/bootstrap.min.css";
import RutasProtegidas from "./components/Permisos/RutasProtegidas";
import PermisosAdmin from "./pages/Administrador/Permisos/PermisosAdmin";
import HomePage from "./pages/Clientes/HomePage/HomePage";
import MisProductos from "./pages/Clientes/MisProductos/MisProductos";
import Carrito from "./pages/Clientes/Carrito/Carrito";
import LayoutPrincipal from "./components/LayoutPrincipal/LayoutPrincipal";
import ProductoDetallePage from "./pages/Clientes/DetalleProductoCliente/DetalleProductoCliente";
import MiProductoDetallePage from "./pages/Clientes/MisProductos/DetalleMiProducto";
import Ventas from "./pages/Clientes/Ventas/Ventas";

const rutas: Record<string, React.ComponentType> = {
  "/accesos": PermisosAdmin,
  "/usuarios": Usuarios,
  "/inicio": HomePage,
  "/misproductos": MisProductos,
  "/carrito": Carrito,
  "/misventas": Ventas,
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
              <Route key={path} path={path} element={<Component />}/>
            ))}
            <Route path="/producto/:pk" element={<ProductoDetallePage />}/>
            <Route path="/detalle-mi-producto/:pk" element={<MiProductoDetallePage />}/>

          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;