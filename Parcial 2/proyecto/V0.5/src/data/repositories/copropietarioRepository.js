const { Copropietario } = require('../../../config/database');

function mapDocument(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    obj.id = obj._id.toString();
    if (obj.usuario_id) {
        obj.usuario_id = obj.usuario_id.toString();
    }
    return obj;
}

class CopropietarioRepository {
    async findAll() {
        const rows = await Copropietario.find({ is_deleted: 0 });
        return rows.map(mapDocument);
    }

    async findByCedula(cedula) {
        const row = await Copropietario.findOne({ cedula, is_deleted: 0 });
        return mapDocument(row);
    }

    async findByEmail(email) {
        const row = await Copropietario.findOne({ email, is_deleted: 0 });
        return mapDocument(row);
    }

    async findById(id) {
        const row = await Copropietario.findOne({ _id: id, is_deleted: 0 });
        return mapDocument(row);
    }

    async findByCasa(casa) {
        const row = await Copropietario.findOne({ casa, is_deleted: 0 });
        return mapDocument(row);
    }

    async findByUsuarioId(usuarioId) {
        const row = await Copropietario.findOne({ usuario_id: usuarioId, is_deleted: 0 });
        return mapDocument(row);
    }

    async create(copropietario) {
        const row = await Copropietario.create({
            cedula: copropietario.cedula,
            nombre: copropietario.nombre,
            casa: copropietario.casa,
            telefono: copropietario.telefono,
            email: copropietario.email,
            saldo: copropietario.saldo,
            usuario_id: copropietario.usuarioId
        });
        return row._id.toString();
    }

    async update(cedula, datos) {
        const res = await Copropietario.updateOne({ cedula }, {
            nombre: datos.nombre,
            casa: datos.casa,
            telefono: datos.telefono,
            email: datos.email,
            saldo: datos.saldo !== undefined ? parseFloat(datos.saldo) : 0.0
        });
        return res.modifiedCount;
    }

    async delete(id) {
        const res = await Copropietario.updateOne({ _id: id }, {
            is_deleted: 1,
            deleted_at: new Date().toISOString()
        });
        return res.modifiedCount;
    }
}

module.exports = new CopropietarioRepository();
