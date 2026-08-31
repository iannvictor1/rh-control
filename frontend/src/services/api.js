import axios from "axios";
import { clearSession, getToken, isTokenValid } from "./utils/auth";

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  const pageHostname = window.location.hostname;
  const pageIsRemote = !["localhost", "127.0.0.1"].includes(pageHostname);

  if (configuredUrl?.startsWith("/")) {
    return configuredUrl;
  }

  if (configuredUrl && pageIsRemote) {
    const url = new URL(configuredUrl);

    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      url.hostname = pageHostname;
      return url.origin;
    }
  }

  return configuredUrl || `${window.location.protocol}//${pageHostname}:8000`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    if (!isTokenValid()) {
      clearSession();
      window.location.href = "/login";
      return config;
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.endsWith("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
