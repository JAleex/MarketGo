import api from "../../api"; 

export const InformacionRolUsuario = async () => {
    try {
        const res = await api.get("/usuarios/perfil-usuario/", { withCredentials: true });
        const { fk_rol } = res.data;
        switch (fk_rol) {
            case 1: return 1; // ES ADMINISTRADOR
            case 2: return 2; // ES USUARIO
            default: return null; // Rol desconocido
        }
    } catch (error) {
        return false; // Devuelve false en caso de error
    }
};


export const InformacionNombreUsuario = async () => {
    try {
        const res = await api.get("/api/user/profile/");
        const nombre  = res.data.nombre;
        return nombre;
       
    } catch (error) {
        return false; // Devuelve false en caso de error
    }
};


export const InformacionUsuario = async () => {
    try {
        const res = await api.get("/usuarios/perfil-usuario/", { withCredentials: true });
        return res;
       
    } catch (error) {
        return false;
    }
};