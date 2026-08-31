export function getToken() {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export function setToken(token) {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
}

function decodePayload(token) {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "=");

    return JSON.parse(atob(padded));
}

export function getUsuarioToken() {
    const token = getToken();

    if (!token) return null;

    try {
        const decoded = decodePayload(token);

        return {
            nome: decoded.nome,
            perfil: decoded.perfil,
            email: decoded.sub,
            exp: decoded.exp,
        };
    } catch {
        return null;
    }
}

export function isTokenValid() {
    const usuario = getUsuarioToken();

    if (!usuario?.exp) return false;

    return usuario.exp * 1000 > Date.now();
}

export function clearSession() {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
}

export function isAdmin() {
    return getUsuarioToken()?.perfil === "admin";
}

export function canManageRh() {
    const perfil = getUsuarioToken()?.perfil;

    return perfil === "admin" || perfil === "rh";
}
