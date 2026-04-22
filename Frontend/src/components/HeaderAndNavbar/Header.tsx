import '../../styles/HeaderAndNavbar/Header.css'
const Header = ({ isNavbarVisible }: { isNavbarVisible: boolean}) => {
    return (
        <>
        <header className={`header ${isNavbarVisible ? 'header-expanded' : 'header-collapsed'}`}>
            <div className="header-overlay">
                <div className="container text-center">
                    <h1 className="header-titulo display-4">MARKET GO</h1>
                </div>
            </div>
        </header>
        </>
    )
}

export default Header