const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = express();

// HTTP-Server erstellen
const server = http.createServer(app);

// Websocket-Server einrichten
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('Client verbunden:', socket.id);
    socket.on('disconnect', () => {
        console.log('Ein Client hat die Verbindung getrennt:', socket.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB-Verbindung
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB-Verbindungsfehler:'));
db.once('open', () => {
    console.log('Mit MongoDB verbunden');
});

// Routen-Importe
const stationsRoute = require('./routes/stations')(io);
const vehiclesRoute = require('./routes/vehicles')(io);
const missionsRoute = require('./routes/missions')(io);

app.use('/api/stations', stationsRoute);
app.use('/api/vehicles', vehiclesRoute);
app.use('/api/missions', missionsRoute);

// Scheduler für automatische Einsatzerstellung starten
const startMissionScheduler = require('./missionScheduler')(io);
startMissionScheduler(45000);

// Standard-Route für nicht gefundene Endpunkte
app.use((req, res) => {
    res.status(404).json({ error: 'Route nicht gefunden' });
});

// Server starten
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});