const Mission = require('./models/Mission');
const Station = require('./models/Station');

module.exports = (io) => {
    // Funktion zum Generieren einer zufälligen Position
    function generateRandomLocation(center, radius) {
        const y0 = center.latitude;
        const x0 = center.longitude;
        const rd = radius / 111.32; // Radius in km (1° ≈ 111.32 km)

        const u = Math.random();
        const v = Math.random();
        const w = rd * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y = w * Math.sin(t);

        return { latitude: y + y0, longitude: x + x0 };
    }

    // Funktion zum automatischen Generieren von Einsätzen
    async function generateMissionsAutomatically() {
        try {
            const stations = await Station.find(); // Alle Wachen abrufen

            if (stations.length === 0) {
                console.log('Keine Wachen vorhanden, keine Einsätze generiert.');
                return;
            }

            // Für jede Wache einen neuen Einsatz generieren
            for (const station of stations) {
                const missionType = station.type === 'Rettungsdienst' ? 'Rettung' : station.type;
                const vehicleRequirements = {
                    Feuerwehr: ['LF', 'DLK', 'RW'],
                    Rettung: ['RTW', 'NEF'],
                    Polizei: ['Streifenwagen'],
                };

                const newMission = {
                    description: `${missionType}-Einsatz automatisch generiert`,
                    location: generateRandomLocation(station.location, 20),
                    type: missionType,
                    requiredVehicles: vehicleRequirements[missionType],
                };

                // Mission speichern
                await Mission.create(newMission);
                console.log(`Einsatz für ${station.name} generiert.`);
            }

            // Websocket-Update
            io.emit('updateMissions', await Mission.find());
        } catch (error) {
            console.error('Fehler beim automatischen Generieren der Einsätze:', error);
        }
    }

    // Timer starten
    function startMissionScheduler(interval = 45000) { 
        console.log(`Automatische Einsatzerstellung alle ${interval / 1000} Sekunden gestartet.`);
        setInterval(generateMissionsAutomatically, interval);
    }

    return startMissionScheduler; // Scheduler zurückgeben
};
