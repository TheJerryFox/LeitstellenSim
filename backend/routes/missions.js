const express = require('express');
const Mission = require('../models/Mission');
const missionScheduler = require("../missionScheduler");

module.exports = (io) => {
    const router = express.Router();

    const { generateMissionsManually } = missionScheduler(io);

    router.post('/generate', async (req, res) => {
        try {
            const { wacheId, anzahl } = req.body;
    
            if (!wacheId || !anzahl) {
                return res.status(400).json({ error: 'WacheId und Anzahl sind erforderlich.' });
            }
    
            const status = await generateMissionsManually(wacheId, anzahl);
            if (status === 404) {
                return res.status(404).json({ error: 'Wache nicht gefunden.' });
            } else if (status === 500) {
                return res.status(500).json({ error: 'Fehler beim Generieren der Einsätze.' });
            }
    
            res.status(201).json({ message: `${anzahl} Einsätze erfolgreich generiert.` });
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
