import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/HeaderAndNavbar/Navbar";
import Header from "../../components/HeaderAndNavbar/Header";
import "../../styles/Shared/shared.css"
const LayoutPrincipal = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  const toggleNavbar = () => {
    setIsNavbarVisible(prev => !prev);
  };

  return (
    <>
      <Navbar
        isNavbarVisible={isNavbarVisible}
        toggleNavbar={toggleNavbar}
      />

      <Header isNavbarVisible={isNavbarVisible} />

      <div
        className={isNavbarVisible? "contenedor-general": "contenedor-alterno"}>
        <Outlet />
      </div>
    </>
  );
};

export default LayoutPrincipal;