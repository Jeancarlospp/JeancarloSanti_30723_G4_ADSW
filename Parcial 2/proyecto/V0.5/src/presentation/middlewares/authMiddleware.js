const usuarioRepository = require('../../data/repositories/usuarioRepository');

// RNF-01: expiración de sesión tras 2 horas de inactividad
const SESION_MAX_INACTIVIDAD_MS = 2 * 60 * 60 * 1000;

function verificarSesion(req, res, next) {
    // Leer rol e ID de usuario del header HTTP
    const role = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    if (!role) {
        return res.status(401).json({ error: "No autorizado. Inicie sesión para acceder a AliGest." });
    }
    if (role !== 'ADMINISTRADOR' && role !== 'COPROPIETARIO') {
        return res.status(403).json({ error: "Acceso denegado. Rol inválido o desconocido." });
    }

    // El cliente reenvía en cada solicitud la marca de tiempo de su última
    // interacción real (clic, tecla, scroll); si ese lapso supera 2 horas,
    // la sesión se considera expirada por inactividad.
    const lastActivity = parseInt(req.headers['x-last-activity'], 10);
    if (!isNaN(lastActivity) && Date.now() - lastActivity > SESION_MAX_INACTIVIDAD_MS) {
        return res.status(401).json({
            error: "Sesión expirada por inactividad. Por favor, inicie sesión nuevamente.",
            sesionExpirada: true
        });
    }

    req.user = { role, id: userId || null };
    next();
}

function permitirSolo(...rolesPermitidos) {
    return (req, res, next) => {
        const role = req.headers['x-user-role'];
        if (!role || !rolesPermitidos.includes(role)) {
            return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes para esta operación." });
        }
        next();
    };
}

async function verificarUltimoAdministrador(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            return next();
        }

        const usuarioTarget = await usuarioRepository.findById(id);
        if (!usuarioTarget) {
            return res.status(404).json({ error: "El usuario especificado no existe en el sistema." });
        }

        // Si se intenta eliminar o desactivar a un administrador, validar si es el último
        if (usuarioTarget.role === 'ADMINISTRADOR') {
            const numAdmins = await usuarioRepository.countAdministrators();
            if (numAdmins <= 1) {
                return res.status(400).json({ 
                    error: "Operación de seguridad denegada: No se puede eliminar o desactivar al último administrador del sistema." 
                });
            }
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    verificarSesion,
    permitirSolo,
    verificarUltimoAdministrador
};
