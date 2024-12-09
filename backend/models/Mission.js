const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  text: { type: String, required: false },
  location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
  },
  requiredVehicles: [{ type: String }],
  assignedVehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
  callerText: { type: String },
  status: { type: String, default: 'offen' },
});

module.exports = mongoose.model('Mission', missionSchema);