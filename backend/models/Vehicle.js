const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: Number, default: 2, required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'destinationType',
        required: false
    },
    destinationType: {
        type: String,
        enum: ['Mission', 'Station'],
        required: false
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
