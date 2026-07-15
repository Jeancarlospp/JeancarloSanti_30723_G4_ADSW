const crypto = require('crypto');
const { Sesion } = require('../../../config/database');

const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

class SessionRepository {
    async create(usuarioId) {
        const ahora = new Date().toISOString();
        const sessionId = crypto.randomBytes(32).toString('hex');
        await Sesion.create({
            session_id: sessionId,
            usuario_id: usuarioId,
            created_at: ahora,
            last_activity_at: ahora
        });
        return sessionId;
    }

    async validateAndTouch(sessionId, ahora = new Date()) {
        if (!sessionId) return { estado: 'AUSENTE' };

        const sesion = await Sesion.findOne({ session_id: sessionId }).populate('usuario_id');
        if (!sesion || !sesion.usuario_id) return { estado: 'INVALIDA' };

        const ultimaActividad = new Date(sesion.last_activity_at);
        if (Number.isNaN(ultimaActividad.getTime()) || ahora.getTime() - ultimaActividad.getTime() > DOS_HORAS_MS) {
            await Sesion.deleteOne({ _id: sesion._id });
            return { estado: 'EXPIRADA' };
        }

        const usuario = sesion.usuario_id;
        if (usuario.status !== 'ACTIVO') {
            await Sesion.deleteOne({ _id: sesion._id });
            return { estado: 'BLOQUEADA' };
        }

        sesion.last_activity_at = ahora.toISOString();
        await sesion.save();

        return {
            estado: 'ACTIVA',
            usuario: {
                id: usuario._id.toString(),
                username: usuario.username,
                email: usuario.email,
                role: usuario.role,
                status: usuario.status,
                mustChangePassword: usuario.must_change_password === 1
            }
        };
    }

    async invalidateUserSessions(usuarioId) {
        const result = await Sesion.deleteMany({ usuario_id: usuarioId });
        return result.deletedCount;
    }

    async invalidate(sessionId) {
        const result = await Sesion.deleteOne({ session_id: sessionId });
        return result.deletedCount;
    }
}

module.exports = new SessionRepository();
