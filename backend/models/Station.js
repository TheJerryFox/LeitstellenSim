const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Feuerwehr', 'Polizei', 'Rettungsdienst'], required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
});

module.exports = mongoose.model('Station', StationSchema);
