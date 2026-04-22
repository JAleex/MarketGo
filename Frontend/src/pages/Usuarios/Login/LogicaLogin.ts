import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Alerts } from "../../../components/Alertas/alertas";

export const LogicaLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [Cargando, setCargando] = useState(false);
    const [formData, setFormData] = useState({ correo: "", password: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.correo || !formData.password) {
            Alerts.warning("Por favor ingrese su correo y contraseña.");
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