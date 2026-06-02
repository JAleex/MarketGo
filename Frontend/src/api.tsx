import axios from "axios";

/**
 * Instancia de Axios preconfigurada para todas las peticiones al backend.
 *
 * - `baseURL` se lee de la variable de entorno `VITE_API_URL`.
 * - `withCredentials: true` para enviar y recibir las cookies JWT (access_token / refresh_token).
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

/** Indica si ya hay en curso una petición de refresco de token. */
let isRefreshing = false;

/** Cola de peticiones que fallaron con 401 mientras se refrescaba el token. */
let failedQueue: any[] = [];

/**
 * Resuelve o rechaza todas las peticiones encoladas tras el intento de refresco.
 * @param error - Error del refresco, o `null` si fue exitoso.
 * @param token - Nuevo access token (no se usa en flujo de cookie, pero mantiene la firma).
 */
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

/**
 * Mapa de peticiones en vuelo para detectar duplicados.
 * Clave: combinación de método + URL + parámetros + body.
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Genera una clave única que identifica una petición por sus datos esenciales.
 * Se usa para deduplicar peticiones idénticas concurrentes.
 * @param config - Objeto de configuración de la petición Axios.
 * @returns Clave en formato `"METHOD:URL:params:body"`.
 */
const getRequestKey = (config: any): string => {
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${config.method}:${config.url}:${params}:${data}`;
};

/**
 * Interceptor de peticiones salientes.
 * Aborta la petición si ya hay una idéntica en vuelo, evitando llamadas duplicadas.
 */
api.interceptors.request.use((config) => {
    const key = getRequestKey(config);

    if (pendingRequests.has(key)) {
        config.signal = AbortSignal.abort();
        return config;
    }

    return config;
});

/**
 * Interceptor de respuestas.
 *
 * - En éxito: elimina la petición del mapa de pendientes.
 * - En error 401: intenta refrescar el access_token via `/usuarios/token/refresh/`
 *   usando el refresh_token de la cookie. Si el refresco tiene éxito, reintenta
 *   la petición original. Si falla, redirige a `/login`.
 * - Peticiones canceladas (deduplicadas): devuelve la promesa original en vuelo.
 */
api.interceptors.response.use(
    response => {
        const key = getRequestKey(response.config);
        pendingRequests.delete(key);
        return response;
    },
    async error => {
        const originalRequest = error.config;

        if (originalRequest) {
            const key = getRequestKey(originalRequest);
            pendingRequests.delete(key);
        }

        if (localStorage.getItem('loggingOut') === 'true') {
            return Promise.reject(error);
        }

        if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
            const key = getRequestKey(originalRequest);
            const pendingPromise = pendingRequests.get(key);
            if (pendingPromise) {
                return pendingPromise;
            }
            return Promise.reject(error);
        }

        if (originalRequest?.url?.includes('/token/refresh/')) {
            isRefreshing = false;
            processQueue(error, null);
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {

        const isAuthRoute =
            originalRequest.url?.includes('/token/') ||
            originalRequest.url?.includes('/chequeo-autenticacion/');

        if (isAuthRoute || window.location.pathname === "/login") {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
            }).then(() => api(originalRequest));
        }

        isRefreshing = true;

        try {
            await axios.post(
            `${import.meta.env.VITE_API_URL}/usuarios/token/refresh/`,
            {},
            { withCredentials: true }
            );

            isRefreshing = false;
            processQueue(null);

            return api(originalRequest);

        } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);


            if (window.location.pathname !== "/login") {
            window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        }
        }
        return Promise.reject(error);
    }
);

export default api;
