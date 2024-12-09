const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = express();

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('Client verbunden:', socket.id);
    socket.on('disconnect', () => {
        console.log('Ein Client hat die Verbindung getrennt:', socket.id);
    });
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB-Verbindungsfehler:'));
db.once('open', () => {
    console.log('Mit MongoDB verbunden');
});

const stationsRoute = require('./routes/stations')(io);
const vehiclesRoute = require('./routes/vehicles')(io);
const missionsRoute = require('./routes/missions')(io);

app.use('/api/stations', stationsRoute);
app.use('/api/vehicles', vehiclesRoute);
app.use('/api/missions', missionsRoute);

const { startMissionScheduler } = require('./missionScheduler')(io);
startMissionScheduler(15000);

app.use((req, res) => {
    console.log(req)
    res.status(404).json({ error: 'Route nicht gefunden' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});