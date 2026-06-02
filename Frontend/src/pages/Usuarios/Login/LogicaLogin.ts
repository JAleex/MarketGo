import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Alerts } from "../../../components/Alertas/alertas";

/**
 * Hook de lógica para la pantalla de inicio de sesión.
 *
 * Gestiona el estado del formulario y delega la autenticación al `AuthContext`.
 * Tras un login exitoso, el contexto redirige al usuario a la ruta correspondiente
 * a su rol. Las cookies JWT las establece el backend en la respuesta.
 *
 * @returns Estado del formulario, manejadores de eventos y flag de carga.
 */
export const LogicaLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [Cargando, setCargando] = useState(false);
    const [formData, setFormData] = useState({ correo: "", password: "" });

    /**
     * Actualiza el campo correspondiente en `formData` cuando el usuario escribe.
     * @param e - Evento de cambio del input.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Valida que ambos campos tengan valor y llama a `login` del AuthContext.
     * Muestra una advertencia si algún campo está vacío.
     * Los errores de credenciales inválidas los maneja el AuthContext internamente.
     */
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
