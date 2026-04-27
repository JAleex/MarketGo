import React, { useState, useEffect } from "react";
import { LogicaRegistro } from "./LogicaRegistro.ts";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../../styles/Usuarios/login.css";
import PantallaCarga from "../../../components/PantallaCarga/PantallaCarga.tsx";
import { RiLockPasswordFill } from "react-icons/ri";
import { FaRegUser, FaEye, FaEyeSlash,  } from "react-icons/fa";
import api from "../../../api.tsx";
import { useNavigate } from "react-router-dom";

const Registro: React.FC = () => {
    const { formData, handleChange, handleSubmit, Cargando } = LogicaRegistro();
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
                    <h4 className="login-title">Registro</h4>
                    <div className="recuadro-login">
                    <span className="textpass" style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>
                        {'<- Volver'}
                    </span>
                    <form onSubmit={(e) => e.preventDefault()} autoComplete="off" className="needs-validation" noValidate>
                        <div className="login-inputs">
                             <div className="text-center mt-4">
                            </div>
                                <label htmlFor="usuario">Usuario</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        className="login-input"
                                        id="usuario"
                                        name="usuario"
                                        value={formData.usuario}
                                        onChange={handleChange}
                                        placeholder="Usuario"
                                        autoComplete="off" 
                                        required
                                    />
                                </div>

                                <label htmlFor="correo">Correo</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        className="login-input"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        placeholder="Usuario@correo.com"
                                        autoComplete="off" 
                                        required
                                    />
                                </div>
                                <label htmlFor="nombre">Nombres</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        className="login-input"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Nombres"
                                        autoComplete="off" 
                                        required
                                    />
                                </div>

                                <label htmlFor="password">Contraseña</label>
                                <div className="input-with-icon">
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
                                <label htmlFor="passwordConfirm">Confirmar Contraseña</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="login-input"
                                        id="passwordConfirm"
                                        name="passwordConfirm"
                                        value={formData.passwordConfirm}
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
                                Registrarse
                            </button>
                        </form>
                    </div>
                    <div className="version-text-login">v1.0.0</div>
                </div>
            </div>
        </>
    );
};

export default Registro;