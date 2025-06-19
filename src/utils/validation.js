// Validación de formularios
export const validateIncidentForm = (values) => {
    const errors = {};

    if (!values.subject) {
        errors.subject = 'El asunto es requerido';
    } else if (values.subject.length < 5) {
        errors.subject = 'El asunto debe tener al menos 5 caracteres';
    }

    if (!values.description) {
        errors.description = 'La descripción es requerida';
    } else if (values.description.length < 20) {
        errors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    return errors;
};

export const validateUserForm = (values) => {
    const errors = {};

    if (!values.name) {
        errors.name = 'El nombre es requerido';
    }

    if (!values.email) {
        errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'El email no es válido';
    }

    if (!values.password) {
        errors.password = 'La contraseña es requerida';
    } else if (values.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    return errors;
};

// Validación de archivos
export const validateFile = (file) => {
    const errors = {};

    if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (file.size > maxSize) {
            errors.file = 'El archivo no debe superar los 5MB';
        }

        if (!allowedTypes.includes(file.type)) {
            errors.file = 'Tipo de archivo no permitido';
        }
    }

    return errors;
};

// Validación de estado de incidencia
export const validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        pendiente: ['en_proceso'],
        en_proceso: ['resuelto'],
        resuelto: ['cerrado'],
        cerrado: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Validación de permisos
export const validatePermission = (userRole, requiredRole) => {
    const roleHierarchy = {
        admin: ['admin', 'soporte', 'usuario'],
        soporte: ['soporte', 'usuario'],
        usuario: ['usuario']
    };

    return roleHierarchy[userRole]?.includes(requiredRole) || false;
}; 