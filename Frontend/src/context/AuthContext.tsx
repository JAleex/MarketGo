import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

type Vista = {
  pk_permiso_rol: number;
  fk_vista: number;
  nombre_vista: string;
  ruta_vista: string;
  tiene_acceso: boolean;
};

type RolPermisos = {
  pk_rol: number;
  nombre_rol: string;
  vistas: Vista[];
};

type User = {
  pk_usuario: number;
  usuario: string;
  correo: string;
  fk_rol: number;
};

type AuthContextType = {
  user: User | null;
  vistas: Vista[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (ruta: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [vistas, setVistas] = useState<Vista[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // 🔥 LOGIN (usa tu endpoint real)
  const login = async (credentials: any) => {
    await api.post("/usuarios/token/", credentials);
    await loadUserData();
  };

  // 🔥 LOGOUT
  const logout = async () => {
    try {
      localStorage.setItem("loggingOut", "true");
      await api.post("/usuarios/logout/");
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      setVistas([]);
      localStorage.removeItem("loggingOut");
      window.location.href = "/login";
    }
  };

  // 🔥 CARGAR USUARIO + PERMISOS POR ROL
  const loadUserData = async () => {
    try {
      // 👤 usuario
      const userRes = await api.get("/usuarios/perfil-usuario/");
      const userData = userRes.data;

      // 🔐 todos los roles con permisos
      const rolesRes = await api.get("/usuarios/roles-permisos/");
      const roles: RolPermisos[] = rolesRes.data;

      // 🎯 encontrar el rol del usuario
      const rolUsuario = roles.find(r => r.pk_rol === userData.fk_rol);

      setUser(userData);
      setVistas(rolUsuario?.vistas || []);
      
    } catch (error) {
      setUser(null);
      setVistas([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 VALIDAR PERMISOS (SOLO POR ROL)
const hasPermission = (ruta: string) => {
  const rutaBase = ruta.split("/").slice(0, 2).join("/");

  return vistas.some(
    v => v.ruta_vista === rutaBase && v.tiene_acceso
  );
};

  // 🔁 CHECK AUTH INICIAL
  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.get("/usuarios/chequeo-autenticacion/");
        await loadUserData();
      } catch {
        setUser(null);
        setVistas([]);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        vistas,
        isAuthenticated,
        loading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};