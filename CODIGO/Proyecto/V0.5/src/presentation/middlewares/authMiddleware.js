const usuarioRepository = require('../../data/repositories/usuarioRepository');
const sessionRepository = require('../../data/repositories/sessionRepository');

// RF-1.1 / RNF-01: la identidad y el rol se obtienen de una sesión almacenada
// en servidor. El cliente nunca decide sus propios permisos mediante headers.
async function verificarSesion(req, res, next) {
    try {
        const sessionId = req.headers['x-session-id'];
        const resultado = await sessionRepository.validateAndTouch(sessionId);

        if (resultado.estado === 'EXPIRADA') {
            return res.status(401).json({
                error: "Sesión expirada por inactividad. Por favor, inicie sesión nuevamente.",
                sesionExpirada: true
            });
        }

        if (resultado.estado !== 'ACTIVA') {
            return res.status(401).json({
                error: "No autorizado. Inicie sesión para acceder a AliGest."
            });
        }

        req.user = resultado.usuario;
        req.sessionId = sessionId;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

function permitirSolo(...rolesPermitidos) {
    return (req, res, next) => {
        const role = req.user && req.user.role;
        if (!role || !rolesPermitidos.includes(role)) {
            return res.status(403).json({
                error: "Acceso denegado. Permisos insuficientes para esta operación."
            });
        }
        next();
    };
}

async function verificarUltimoAdministrador(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) return next();

        const usuarioTarget = await usuarioRepository.findById(id);
        if (!usuarioTarget) {
            return res.status(404).json({ error: "El usuario especificado no existe en el sistema." });
        }

        const esEliminacion = req.method === 'DELETE';
        const nuevoRole = req.body && req.body.role;
        const nuevoStatus = req.body && req.body.status;
        const dejaDeSerAdminActivo = esEliminacion
            || (nuevoRole && nuevoRole !== 'ADMINISTRADOR')
            || (nuevoStatus && nuevoStatus !== 'ACTIVO');

        if (usuarioTarget.role === 'ADMINISTRADOR' && usuarioTarget.status === 'ACTIVO' && dejaDeSerAdminActivo) {
            const numAdmins = await usuarioRepository.countAdministrators();
            if (numAdmins <= 1) {
                const esPropioPerfil = req.user && String(req.user.id) === String(id);
                const error = esPropioPerfil
                    ? "No puede degradar su propio perfil. Debe existir al menos un Administrador activo en el sistema."
                    : "No puede degradar este perfil. El sistema requiere al menos un Administrador activo. Asigne primero otro Administrador.";
                return res.status(400).json({ error });
            }
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { verificarSesion, permitirSolo, verificarUltimoAdministrador };
