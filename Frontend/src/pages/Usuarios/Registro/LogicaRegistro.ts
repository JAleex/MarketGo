import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Alerts } from "../../../components/Alertas/alertas";

export const LogicaRegistro = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
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

        try {
            setCargando(true);
            await login(formData.correo, formData.password);
            setCargando(false);
        } catch {
            setCargando(false);
        }
    };

    return { formData, handleChange, handleSubmit, Cargando };
};