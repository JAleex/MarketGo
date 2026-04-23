import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

const pendingRequests = new Map<string, Promise<any>>();

const getRequestKey = (config: any): string => {
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${config.method}:${config.url}:${params}:${data}`;
};

api.interceptors.request.use((config) => {
    const key = getRequestKey(config);
    
    if (pendingRequests.has(key)) {
        config.signal = AbortSignal.abort();
        return config;
    }
    
    return config;
});

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
    }
);

export default api;