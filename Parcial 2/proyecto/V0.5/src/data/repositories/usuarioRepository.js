const { Usuario, Copropietario } = require('../../../config/database');

function mapDocument(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj.id = obj._id.toString();
    return obj;
}

class UsuarioRepository {
    async findByUsername(username) {
        const user = await Usuario.findOne({ username });
        return mapDocument(user);
    }

    async findByEmail(email) {
        const user = await Usuario.findOne({ email });
        return mapDocument(user);
    }

    async findById(id) {
        const user = await Usuario.findById(id);
        return mapDocument(user);
    }

    async findAll() {
        const users = await Usuario.find({}, 'username email role status');
        return await Promise.all(users.map(async (user) => {
            const mapped = mapDocument(user);
            const copro = await Copropietario.findOne({ usuario_id: user._id, is_deleted: 0 }, 'nombre casa');
            return {
                ...mapped,
                nombre: copro ? copro.nombre : '',
                casa: copro ? copro.casa : ''
            };
        }));
    }

    async create(username, email, hashedPassword, role, mustChangePassword = 0) {
        const user = await Usuario.create({
            username,
            email,
            password: hashedPassword,
            role,
            status: 'ACTIVO',
            must_change_password: mustChangePassword
        });
        return mapDocument(user);
    }

    async updateRecoveryCode(username, code, expirationIso) {
        const res = await Usuario.updateOne({ username }, {
            recovery_code: code,
            recovery_code_expires_at: expirationIso,
            recovery_attempts: 0
        });
        return res.modifiedCount;
    }

    async incrementRecoveryAttempts(username) {
        const user = await Usuario.findOneAndUpdate(
            { username },
            { $inc: { recovery_attempts: 1 } },
            { returnDocument: 'after' }
        );
        return user ? user.recovery_attempts : 0;
    }

    async clearRecoveryCode(username) {
        const res = await Usuario.updateOne({ username }, {
            recovery_code: null,
            recovery_code_expires_at: null,
            recovery_attempts: 0
        });
        return res.modifiedCount;
    }

    async updatePasswordAndClearRecovery(username, hashedPassword) {
        const res = await Usuario.updateOne({ username }, {
            password: hashedPassword,
            recovery_code: null,
            recovery_code_expires_at: null,
            recovery_attempts: 0,
            failed_attempts: 0,
            status: 'ACTIVO',
            lockout_until: null
        });
        return res.modifiedCount;
    }

    async updatePasswordAndClearMustChange(username, hashedPassword) {
        const res = await Usuario.updateOne({ username }, {
            password: hashedPassword,
            must_change_password: 0
        });
        return res.modifiedCount;
    }

    // RF-2.4: Regenerar contraseña temporal al cambiar el representante (cédula) de un copropietario
    async updatePasswordAndForceMustChange(id, hashedPassword) {
        const res = await Usuario.updateOne({ _id: id }, {
            password: hashedPassword,
            must_change_password: 1
        });
        return res.modifiedCount;
    }

    async incrementFailedAttempts(username) {
        const res = await Usuario.updateOne({ username }, {
            $inc: { failed_attempts: 1 }
        });
        return res.modifiedCount;
    }

    async lockoutUser(username, lockoutUntilIso) {
        const res = await Usuario.updateOne({ username }, {
            status: 'BLOQUEADO',
            lockout_until: lockoutUntilIso
        });
        return res.modifiedCount;
    }

    async resetFailedAttempts(username) {
        const res = await Usuario.updateOne({ username }, {
            failed_attempts: 0,
            status: 'ACTIVO',
            lockout_until: null
        });
        return res.modifiedCount;
    }

    async updatePerfil(id, role, status) {
        const res = await Usuario.updateOne({ _id: id }, { role, status });
        return res.modifiedCount;
    }

    async updateEmail(id, email) {
        const res = await Usuario.updateOne({ _id: id }, { email });
        return res.modifiedCount;
    }

    async countAdministrators() {
        return await Usuario.countDocuments({ role: 'ADMINISTRADOR', status: 'ACTIVO' });
    }

    async delete(id) {
        const res = await Usuario.deleteOne({ _id: id });
        return res.deletedCount;
    }
}

module.exports = new UsuarioRepository();
