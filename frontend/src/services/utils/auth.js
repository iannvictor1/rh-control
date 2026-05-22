export function getToken() {
    return localStorage.getItem("token");
}

export function getUsuarioToken() {
    const token = getToken();

    if (!token) return null;

    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));

        return {
            nome: decoded.nome,
            perfil: decoded.perfil,
            email: decoded.sub,
        };
    } catch {
        return null;
    }
}

export function isAdmin() {
    return getUsuarioToken()?.perfil === "admin";
}

export function canManageRh() {
    const perfil = getUsuarioToken()?.perfil;

    return perfil === "admin" || perfil === "rh";
}
