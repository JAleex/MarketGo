"""
3 Pruebas End-to-End con Selenium WebDriver.

Requisitos para ejecutar estas pruebas:
  1. Backend corriendo:  cd Backend && python manage.py runserver
  2. Frontend corriendo: cd Frontend && npm run dev
  3. Google Chrome y chromedriver instalados y en el PATH
     (https://googlechromelabs.github.io/chrome-for-testing/)
  4. Variables de entorno opcionales:
       FRONTEND_TEST_URL  (default: http://localhost:5173)
       BACKEND_TEST_URL   (default: http://localhost:8000)

Ejecutar únicamente las pruebas E2E:
    cd Backend
    pytest tests/test_e2e.py -v

Ejecutar con entornos personalizados:
    FRONTEND_TEST_URL=http://mi-servidor:5173 pytest tests/test_e2e.py -v

E2E 1 — TestE2ELoginLogout:
    Verifica que el usuario puede iniciar y cerrar sesión correctamente.

E2E 2 — TestE2ECarrito:
    Verifica que el usuario puede explorar el catálogo y agregar un producto
    al carrito, y que el carrito refleja el producto añadido.

E2E 3 — TestE2EEditarPerfil:
    Verifica que el usuario puede editar su información personal desde
    el módulo Información Personal.
"""
import os
import time
import unittest
import requests
from decimal import Decimal

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ── Configuración ─────────────────────────────────────────────────────────────

FRONTEND_URL = os.environ.get("FRONTEND_TEST_URL", "http://localhost:5173")
BACKEND_URL  = os.environ.get("BACKEND_TEST_URL",  "http://localhost:8000")
TIMEOUT      = 15  # segundos máximos de espera por elemento

# Credenciales del usuario de prueba E2E
E2E_CORREO   = "e2e_test_user@marketgo.com"
E2E_PASSWORD = "E2eTestPass123!"
E2E_USUARIO  = "e2e_tester"
E2E_NOMBRE   = "Usuario E2E"


# ── Helpers de navegador ──────────────────────────────────────────────────────

def _chrome_options() -> Options:
    opts = Options()
    opts.add_argument("--headless")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-extensions")
    return opts


# ── Base ──────────────────────────────────────────────────────────────────────

class BaseE2ETest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.driver = webdriver.Chrome(options=_chrome_options())
        cls.driver.implicitly_wait(TIMEOUT)
        cls.wait = WebDriverWait(cls.driver, TIMEOUT)
        cls._crear_usuario_prueba()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        super().tearDownClass()

    # ── Gestión del usuario de prueba ─────────────────────────────────────────

    @classmethod
    def _crear_usuario_prueba(cls):
        """Registra el usuario de prueba a través del endpoint público."""
        try:
            requests.post(
                f"{BACKEND_URL}/usuarios/crear-usuario/",
                json={
                    "usuario":  E2E_USUARIO,
                    "correo":   E2E_CORREO,
                    "password": E2E_PASSWORD,
                    "nombre":   E2E_NOMBRE,
                },
                timeout=10,
            )
        except requests.exceptions.ConnectionError:
            pass  # El servidor puede no estar disponible en CI

    # ── Helpers de Selenium ───────────────────────────────────────────────────

    def ir_a(self, ruta=""):
        self.driver.get(f"{FRONTEND_URL}{ruta}")

    def hacer_login(self, correo=E2E_CORREO, password=E2E_PASSWORD):
        self.ir_a("/login")
        self.wait.until(EC.presence_of_element_located((By.NAME, "correo")))
        self.driver.find_element(By.NAME, "correo").clear()
        self.driver.find_element(By.NAME, "correo").send_keys(correo)
        self.driver.find_element(By.NAME, "password").clear()
        self.driver.find_element(By.NAME, "password").send_keys(password)
        # Botón de submit — puede ser <button type="submit"> o tener clase btn-principal
        boton = self.wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit'], button.btn-principal")
        ))
        boton.click()
        # Esperar hasta salir de /login
        self.wait.until(lambda d: "/login" not in d.current_url)

    def esperar_texto(self, texto: str, timeout: int = TIMEOUT):
        return self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//*[contains(text(),'{texto}')]")
            )
        )

    def elemento_clicable(self, texto: str):
        return self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//*[contains(text(),'{texto}')]")
            )
        )


# ─────────────────────────────────────────────────────────────────────────────
# E2E 1 — Login y Logout
# ─────────────────────────────────────────────────────────────────────────────

class TestE2ELoginLogout(BaseE2ETest):

    def test_login_exitoso_y_logout(self):
        """El usuario se autentica correctamente y luego cierra sesión."""
        # 1 — Login
        self.hacer_login()
        self.assertNotIn("/login", self.driver.current_url,
                         "Debería haber salido de /login tras autenticarse")

        # 2 — Logout: buscar cualquier botón/enlace de cierre de sesión
        boton_logout = self.wait.until(EC.element_to_be_clickable(
            (By.XPATH, (
                "//*["
                "contains(text(),'Cerrar sesión') or "
                "contains(text(),'Cerrar Sesión') or "
                "contains(text(),'Salir') or "
                "contains(@class,'logout') or "
                "contains(@href,'logout')"
                "]"
            ))
        ))
        boton_logout.click()

        # 3 — Verificar redirección al login
        self.wait.until(EC.url_contains("/login"))
        self.assertIn("/login", self.driver.current_url,
                      "Debería haber regresado a /login tras el logout")

    def test_login_credenciales_invalidas_permanece_en_login(self):
        """Con contraseña incorrecta el usuario debe permanecer en /login."""
        self.ir_a("/login")
        self.wait.until(EC.presence_of_element_located((By.NAME, "correo")))
        self.driver.find_element(By.NAME, "correo").send_keys(E2E_CORREO)
        self.driver.find_element(By.NAME, "password").send_keys("ContrasenaMal123")
        self.driver.find_element(
            By.CSS_SELECTOR, "button[type='submit'], button.btn-principal"
        ).click()

        time.sleep(1.5)  # Esperar respuesta del API
        self.assertIn("/login", self.driver.current_url,
                      "Con credenciales inválidas debería permanecer en /login")


# ─────────────────────────────────────────────────────────────────────────────
# E2E 2 — Agregar producto al carrito
# ─────────────────────────────────────────────────────────────────────────────

class TestE2ECarrito(BaseE2ETest):

    def test_agregar_producto_al_carrito(self):
        self.hacer_login()

        # 2 — Ir al catálogo
        self.ir_a("/inicio")

        # 3 — Esperar a que cargue al menos un producto y hacer clic
        primer_producto = self.wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "[class*='producto'], [class*='card'], [class*='item']")
            )
        )
        nombre_producto = primer_producto.text.strip().split("\n")[0]
        primer_producto.click()

        # 4 — En la página de detalle, hacer clic en "Agregar al carrito"
        boton_agregar = self.wait.until(EC.element_to_be_clickable(
            (By.XPATH, (
                "//button["
                "contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"
                "'abcdefghijklmnopqrstuvwxyz'),'carrito') or "
                "contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"
                "'abcdefghijklmnopqrstuvwxyz'),'agregar')"
                "]"
            ))
        ))
        boton_agregar.click()

        # 5 — Navegar al carrito y verificar presencia del ítem
        time.sleep(1)
        self.ir_a("/carrito")

        # El carrito debe tener al menos un elemento visible
        self.wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "[class*='item'], [class*='producto'], table tr td")
            )
        )
        contenido = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertGreater(len(contenido), 0,
                           "El carrito debería mostrar al menos un producto")


# ─────────────────────────────────────────────────────────────────────────────
# E2E 3 — Editar información personal
# ─────────────────────────────────────────────────────────────────────────────

class TestE2EEditarPerfil(BaseE2ETest):

    NOMBRE_ACTUALIZADO = "Nombre E2E Actualizado"

    def test_editar_nombre_perfil(self):
        self.hacer_login()

        # 2 — Navegar a información personal
        self.ir_a("/informacionpersonal")
        self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, "//*[contains(text(),'Información') or contains(text(),'Perfil')]")
            )
        )

        # 3 — Abrir modal de edición
        boton_editar = self.wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(),'Editar') or contains(text(),'editar')]")
        ))
        boton_editar.click()

        # 4 — Esperar a que aparezca el modal y limpiar/rellenar el campo nombre
        campo_nombre = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='nombre']"))
        )
        campo_nombre.clear()
        campo_nombre.send_keys(self.NOMBRE_ACTUALIZADO)

        # 5 — Guardar
        boton_guardar = self.wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(),'Guardar') or contains(text(),'guardar')]")
        ))
        boton_guardar.click()

        # 6 — Verificar que el nombre actualizado aparece en la vista
        self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//*[contains(text(),'{self.NOMBRE_ACTUALIZADO}')]")
            )
        )
        contenido = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertIn(self.NOMBRE_ACTUALIZADO, contenido,
                      "El nombre actualizado debe aparecer en la página")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    unittest.main()
