const Mission = require('./models/Mission');
const Station = require('./models/Station');

const missionTemplates = require('./data/missions.json');

module.exports = (io) => {

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

    async function generateMissionsAutomatically() {
        try {
            const stations = await Station.find();
    
            if (stations.length === 0) {
                console.warn('Keine Stationen vorhanden. Einsätze können nicht generiert werden.');
                return;
            }
    
            const missions = await Mission.find();
            if (missions.length >= stations.length * 2) return;
    
            const newMissions = [];
            for (const station of stations) {
                const radius = 20;
                const randomMission = missionTemplates.filter(mission => mission.type === station.type)[Math.floor(Math.random() * missionTemplates.length)];
                if(!randomMission) return;
                newMissions.push({
                    description: randomMission.name,
                    location: generateRandomLocation(station.location, radius),
                    type: randomMission.type,
                    requiredVehicles: randomMission.requiredVehicles,
                });
            }
    
            await Mission.insertMany(newMissions);
            console.log(`${newMissions.length} Einsätze automatisch generiert.`);
            io.emit('updateMissions', await Mission.find());
        } catch (error) {
            console.error('Fehler beim automatischen Generieren der Einsätze:', error);
        }
    }
    

    async function generateMissionsManually(stationId, count) {
        try {
            const station = await Station.findById(stationId);
            if (!station) {
                console.error('Station nicht gefunden.');
                return 404;
            }
    
            const radius = 20;
            const newMissions = [];
            for (let i = 0; i < count; i++) {
                const randomMission = missionTemplates[Math.floor(Math.random() * missionTemplates.length)];
                newMissions.push({
                    description: randomMission.name,
                    location: generateRandomLocation(station.location, radius),
                    type: randomMission.type,
                    requiredVehicles: randomMission.requiredVehicles,
                });
            }
    
            await Mission.insertMany(newMissions);
    
            io.emit('updateMissions', await Mission.find());
            return 201;
        } catch (error) {
            console.error('Fehler beim Generieren der Einsätze:', error);
            return 500;
        }
    }

    function startMissionScheduler(interval = 45000) { 
        console.log(`Automatische Einsatzerstellung alle ${interval / 1000} Sekunden gestartet.`);
        setInterval(generateMissionsAutomatically, interval);
    }

    return { startMissionScheduler, generateMissionsManually };
};
