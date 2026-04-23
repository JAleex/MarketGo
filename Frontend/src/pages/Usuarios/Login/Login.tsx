import React, { useState, useEffect } from "react";
import { LogicaLogin } from "./LogicaLogin";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../styles/Usuarios/login.css";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga.tsx";
import { RiLockPasswordFill } from "react-icons/ri";
import { FaRegUser, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../../api.tsx";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const { formData, handleChange, handleSubmit, Cargando } = LogicaLogin();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <PantallaCarga isLoading={Cargando} />
            <div className="login-container">
                {/* Lado izquierdo - Fondo azul con logo */}
                <div className="login-text">
                        <h1>MARKET GO</h1>
                </div>
                <div className="login-background">
                    <div className="login-image-header">
                        <img src="/images/silueta_leopardo.webp" alt="Logo" className="logo-img"/>
                    </div>
                </div>

                {/* Lado derecho - Formulario */}
                <div className="login-card">    
                    <h4 className="login-title">Iniciar Sesión</h4>
                    <div className="recuadro-login">

                    <form onSubmit={(e) => e.preventDefault()} autoComplete="off" className="needs-validation" noValidate>
                        <div className="login-inputs">
                                <label htmlFor="correo">Correo / Usuario</label>
                                <div className="input-with-icon">
                                    <FaRegUser className="input-icon" />
                                    <input
                                        type="text"
                                        className="login-input"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        placeholder="Correo@registraduria.gov.co / Usuario"
                                        autoComplete="off" 
                                        required
                                    />
                                </div>

                                <label htmlFor="password">Contraseña</label>
                                <div className="input-with-icon">
                                    <RiLockPasswordFill className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="login-input"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Contraseña"
                                        autoComplete="off" 
                                        required
                                    />
                                    <div
                                        className="password-toggle-icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="login-button mb-2"
                            >
                                Iniciar Sesión
                            </button>

                            <div className="text-center mt-4">
                                <span
                                    className="textpass"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate("/recuperar_contrasena")}
                                >
                                    ¿Olvidó su Contraseña?
                                </span>
                            </div>
                        </form>
                    </div>
                    <div className="version-text-login">v1.0.0</div>
                </div>
            </div>
        </>
    );
};

export default Login;