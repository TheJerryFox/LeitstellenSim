const express = require('express');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');

module.exports = (io) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
        const stations = await Station.find();
        res.json(stations);
        } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Wachen' });
        }
    });

    router.post('/', async (req, res) => {
        try {
        const station = new Station(req.body);
        await station.save();
        io.emit('updateStations', await Station.find());
        res.status(201).json(station);
        } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen der Wache' });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
        const stationId = req.params.id;
        const station = await Station.findById(stationId);
        if (!station) {
            return res.status(404).json({ error: 'Station nicht gefunden' });
        }

        await Vehicle.deleteMany({ station: stationId });
        await Station.findByIdAndDelete(stationId);

        io.emit('updateStations', await Station.find());
        res.status(200).json({ message: 'Station und zugehörige Fahrzeuge erfolgreich gelöscht' });
        } catch (error) {
        res.status(500).json({ error: 'Fehler beim Löschen der Station' });
        }
    });

    return router;
};