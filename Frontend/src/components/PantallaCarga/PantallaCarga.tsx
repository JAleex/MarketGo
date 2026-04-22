// LoadingScreen.js
import React from 'react';
import '../../styles/PantallaCarga/pantallaCarga.css'; 


interface LoadingScreenProps {
    isLoading: boolean;
  }

  const PantallaCarga: React.FC<LoadingScreenProps> = ({ isLoading }) => {
    if (!isLoading) return null;
  
        return (
            <div className="fullscreen-blur-rutas">
                <div className="loading-content-rutas">
                    <div className="logo-ring-container-rutas">
                        <div className="loading-ring-rutas"></div>
                        <img 
                            src={`${import.meta.env.BASE_URL}Imagenes/Logo_regis_NEGRO.png`}
                            alt="Logo"
                            className="loading-logo-rutas"
                            style={{ width: '200px', height: '250px' }}
                        />
                    </div>
                    <p className="loading-text-rutas">Cargando...</p>
                </div>
            </div>
        );
  };
  
  export default PantallaCarga;