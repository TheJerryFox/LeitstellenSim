const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Station = require('../models/Station');

module.exports = (io) => {
    router.get('/', async (req, res) => {
        try {
            const vehicles = await Vehicle.find();
            res.json(vehicles);
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Abrufen der Fahrzeuge' });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { stationId, ...vehicleData } = req.body;
            const station = await Station.findById(stationId);
            if (!station) {
                return res.status(404).json({ error: 'Wache nicht gefunden' });
            }

            const vehicle = new Vehicle({
                ...vehicleData,
                location: station.location,
            });

            await vehicle.save();
            io.emit('updateVehicles', await Vehicle.find());
            res.status(201).json(vehicle);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Fehler beim Erstellen des Fahrzeugs' });
        }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const vehicleId = req.params.id;
            const updateData = req.body;
    
            const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, updateData, { new: true });
            if (!vehicle) {
                return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
            }
            const vehicles = await Vehicle.find();
            io.emit('updateVehicles', vehicles);
    
            res.json(vehicle);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Fahrzeugs' });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const vehicleId = req.params.id;

            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
            }

            await Vehicle.findByIdAndDelete(vehicleId);
            io.emit('updateVehicles', await Vehicle.find());
            res.status(200).json({ message: 'Fahrzeug erfolgreich gelöscht' });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Löschen des Fahrzeugs' });
        }
    });

    router.get('/station/:stationId', async (req, res) => {
        try {
            const vehicles = await Vehicle.find({ station: req.params.stationId });
            res.json(vehicles);
        } catch (error) {
            console.error('Fehler beim Abrufen der Fahrzeuge:', error.message);
            res.status(500).json({ error: 'Fehler beim Abrufen der Fahrzeuge' });
        }
    });

    return router;
};