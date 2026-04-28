import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api";
import { Alerts } from "../../../components/Alertas/alertas";

export const LogicaRegistro = () => {
    const navigate = useNavigate();
    const [Cargando, setCargando] = useState(false);
    const [formData, setFormData] = useState({ usuario: "", nombre: "", correo: "", password: "", passwordConfirm: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    

    const handleSubmit = async () => {
        if (!formData.correo || !formData.password || !formData.usuario || !formData.nombre || !formData.passwordConfirm) {
            Alerts.warning("Por favor ingrese los datos solicitados.");
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            Alerts.warning("Las contraseñas no coinciden.");
            return;
        }


        try {
            setCargando(true);
            await register(formData);
            setCargando(false);
        } catch {
            setCargando(false);
        }
    };

const register = async (formData: any) => {
    try {
        setCargando(true);

        const response = await api.post(
            `${import.meta.env.VITE_API_URL}/usuarios/crear-usuario/`,
            formData, 
        );
        setCargando(false);
        const result = await Alerts.confirm(
            response.data?.message || "Usuario registrado exitosamente",
            {
                title: "Registro completado",
                confirmText: "Ir al login",
                showCancelButton: false
            }
        );

        if (result.isConfirmed) {
            navigate("/login");
        }


    } catch (error: any) {
        if (error.response) {
            const msg = error.response.data?.message || "Error al registrar usuario";
            Alerts.error(msg);
        } else {
            Alerts.error("Error de conexión con el servidor");
        }
    } finally {
        setCargando(false);
    }
};


    return { formData, handleChange, handleSubmit, Cargando };
};