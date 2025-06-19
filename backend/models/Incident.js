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
    category: {
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
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
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

module.exports = mongoose.model('Incident', incidentSchema); 