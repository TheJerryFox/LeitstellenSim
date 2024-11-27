const express = require('express');
const Mission = require('../models/Mission');
const Station = require('../models/Station');

function generateRandomLocation(center, radius) {
    const y0 = center.latitude;
    const x0 = center.longitude;
    const rd = radius / 111.32;

    const u = Math.random();
    const v = Math.random();
    const w = rd * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    return { latitude: y + y0, longitude: x + x0 };
}

module.exports = (io) => {
    const router = express.Router();

    router.post('/generate', async (req, res) => {
        try {
            const { wacheId, anzahl } = req.body;

            const wache = await Station.findById(wacheId);
            if (!wache) {
                return res.status(404).json({ error: 'Wache nicht gefunden' });
            }

            const missionType = wache.type === 'Rettungsdienst' ? 'Rettung' : wache.type;
            const vehicleRequirements = {
                Feuerwehr: ['LF', 'DLK', 'RW'],
                Rettung: ['RTW', 'NEF'],
                Polizei: ['Streifenwagen'],
            };

            const radius = 20;
            const missions = [];
            for (let i = 0; i < anzahl; i++) {
                missions.push({
                    description: `${missionType}-Einsatz ${i + 1}`,
                    location: generateRandomLocation(wache.location, radius),
                    type: missionType,
                    requiredVehicles: vehicleRequirements[missionType],
                });
            }

            const createdMissions = await Mission.insertMany(missions);

            io.emit('updateMissions', await Mission.find());
            res.status(201).json(createdMissions);
        } catch (error) {
            console.error('Fehler beim Generieren der Einsätze:', error);
            res.status(500).json({ error: 'Fehler beim Generieren der Einsätze' });
        }
    });

    router.patch('/:id', async (req, res) => {
        try {
            const missionId = req.params.id;
            const updateData = req.body;
    
            const mission = await Mission.findByIdAndUpdate(missionId, updateData, { new: true });
            if (!mission) {
                return res.status(404).json({ error: 'Einsatz nicht gefunden' });
            }
    
            // Aktualisierte Einsätze über WebSocket senden
            const missions = await Mission.find();
            io.emit('updateMissions', missions);
            res.json(mission);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Einsatzes:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Einsatzes' });
        }
    });    

    router.delete('/deleteAll', async (req, res) => {
        try {
            await Mission.deleteMany();
            io.emit('updateMissions', []);
            res.status(200).json({ message: 'Alle Missionen wurden gelöscht' });
        } catch (error) {
            console.error('Fehler beim Löschen der Missionen:', error);
            res.status(500).json({ error: 'Fehler beim Löschen der Missionen' });
        }
    });

    router.get('/', async (req, res) => {
        const missions = await Mission.find();
        res.json(missions);
    });

    router.get('/:id', async (req, res) => {
        const missionId = req.params.id;
        const mission = await Mission.findById(missionId);
        if (!mission) {
            return res.status(404).json({ error: 'Einsatz nicht gefunden' });
        }
        res.json(mission);
    });

    return router;
};
