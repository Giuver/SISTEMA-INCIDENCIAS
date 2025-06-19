const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    color: {
        type: String,
        required: true,
        default: '#4CAF50' // Verde claro por defecto
    }
});

module.exports = mongoose.model('Category', categorySchema); 