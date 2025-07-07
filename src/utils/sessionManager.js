// sessionManager.js
// Gestor de sesión persistente en localStorage (estilo clásico)

const STORAGE_KEY = 'authData';

const sessionManager = {
    setAuthData(authData) {
        if (!authData) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    },
    getAuthData() {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item || item === 'undefined') return null;
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error('Error parseando authData:', item, e);
            return null;
        }
    },
    logout() {
        localStorage.removeItem(STORAGE_KEY);
    }
};

export default sessionManager; 