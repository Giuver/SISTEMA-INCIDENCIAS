const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    attachment: {
        type: String, // URL o ruta del archivo
        required: false
    },
    area: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['Baja', 'Media', 'Alta', 'Crítica'],
        default: 'Media',
        required: true
    },
    status: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'resuelto', 'cerrado'],
        default: 'pendiente'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    solution: {
        type: String,
        required: false
    },
    resolvedAt: {
        type: Date
    },
    history: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            action: { type: String, required: true },
            comment: { type: String },
            date: { type: Date, default: Date.now }
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            text: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }
    ],
    tags: [{ type: String }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware para actualizar updatedAt
incidentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Método para agregar entrada al historial
incidentSchema.methods.addToHistory = function (action, comment, userId) {
    this.history.push({
        user: userId,
        action: action,
        comment: comment,
        date: new Date()
    });
    return this.save();
};

// Método para resolver incidencia
incidentSchema.methods.resolve = function (solution, userId) {
    this.status = 'resuelto';
    this.solution = solution;
    this.resolvedAt = new Date();
    return this.addToHistory('Resolución', `Incidencia resuelta: ${solution}`, userId);
};

// Métodos estáticos para estadísticas
incidentSchema.statics.getStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

incidentSchema.statics.getPriorityStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 }
            }
        }
    ]);
};

incidentSchema.statics.getCategoryStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$area',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Middleware para agregar entrada inicial al historial
incidentSchema.pre('save', function (next) {
    if (this.isNew && this.history.length === 0) {
        this.history.push({
            user: this.createdBy,
            action: 'Creación',
            comment: 'Incidencia registrada',
            date: new Date()
        });
    }
    next();
});

module.exports = mongoose.model('Incident', incidentSchema); 