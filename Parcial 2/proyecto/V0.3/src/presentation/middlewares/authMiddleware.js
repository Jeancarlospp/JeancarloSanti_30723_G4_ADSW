const usuarioRepository = require('../../data/repositories/usuarioRepository');

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
    req.user = { role, id: userId ? parseInt(userId, 10) : null };
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
