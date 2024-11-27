import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { io } from 'socket.io-client';

// Standard-Icon für Marker
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom-Icons für unterschiedliche Typen
const fireStationIcon = new L.Icon({
  iconUrl: '/icons/fire-station.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const policeStationIcon = new L.Icon({
  iconUrl: '/icons/police-station.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const medicalStationIcon = new L.Icon({
  iconUrl: '/icons/medical-station.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const missionIcon = new L.Icon({
  iconUrl: '/icons/mission.png',
  iconSize: [25, 25],
  iconAnchor: [12.5, 25],
});

const vehicleIcon = new L.Icon({
  iconUrl: '/icons/rtw.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Funktion für die Routenberechnung
async function getRoute(start, destination) {
  try {
    const response = await axios.get(
      `http://localhost:5001/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    );
    return response.data.routes[0]; // Rückgabe der Route
  } catch (error) {
    console.error('Fehler beim Abrufen der Route:', error);
    return null;
  }
}

const movingVehicles = new Set();
const routeCache = {};

async function moveVehicle(vehicle, onUpdate) {
    if (!vehicle.destination || movingVehicles.has(vehicle._id)) {
        console.log(`${vehicle.name} im Set`);
        return;
    }

    console.log(`Bewege ${vehicle.name}`);
    movingVehicles.add(vehicle._id); // Fahrzeug als "in Bewegung" markieren
    const cacheKey = `${vehicle._id}-${vehicle.destination}`;
    let coordinates;
    let destination; // Hier destination definieren

    try {
        if (routeCache[cacheKey]) {
            coordinates = routeCache[cacheKey];
        } else {
            const destinationDetails = await axios.get(`http://localhost:5000/api/${vehicle.destinationType.toLowerCase()}s/${vehicle.destination}`);
            destination = destinationDetails.data.location; // Ziel hier setzen

            const route = await getRoute(vehicle.location, destination);
            if (!route) {
                console.error(`Route für Fahrzeug ${vehicle.name} konnte nicht abgerufen werden.`);
                movingVehicles.delete(vehicle._id);
                return;
            }

            coordinates = route.geometry.coordinates;
            routeCache[cacheKey] = coordinates;
        }

        let index = 0;

        const interval = setInterval(() => {
            if (index >= coordinates.length - 1) {
                clearInterval(interval);
                vehicle.status = vehicle.destinationType === 'Mission' ? 4 : 2; // Ziel erreicht
                vehicle.location = destination; // Zielkoordinaten setzen
                vehicle.destination = null; // Ziel zurücksetzen
                axios.patch(`http://localhost:5000/api/vehicles/${vehicle._id}`, {
                    status: vehicle.status,
                    location: vehicle.location,
                    destination: null,
                });
                delete routeCache[cacheKey];
                onUpdate(vehicle);
                movingVehicles.delete(vehicle._id); // Entferne Fahrzeug aus Set
                return;
            }
            const nextPosition = coordinates[index];
            vehicle.location = { latitude: nextPosition[1], longitude: nextPosition[0] };
            onUpdate(vehicle);

            index++;
        }, 1000);
    } catch (error) {
        console.error(`Fehler bei der Bewegung des Fahrzeugs ${vehicle.name}:`, error);
        movingVehicles.delete(vehicle._id); // Entferne Fahrzeug aus Set bei Fehler
    }
}

function MapComponent() {
  const [stations, setStations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_URL);

    socket.on('updateStations', (data) => setStations(data));
    socket.on('updateMissions', (data) => setMissions(data));
    socket.on('updateVehicles', (data) => setVehicles(data));

    axios.get(`${process.env.REACT_APP_API_URL}/stations`)
      .then((response) => setStations(response.data))
      .catch((error) => console.error('Fehler beim Abrufen der Wachen:', error));

    axios.get(`${process.env.REACT_APP_API_URL}/missions`)
      .then((response) => setMissions(response.data))
      .catch((error) => console.error('Fehler beim Abrufen der Einsätze:', error));

    axios.get(`${process.env.REACT_APP_API_URL}/vehicles`)
      .then((response) => setVehicles(response.data))
      .catch((error) => console.error('Fehler beim Abrufen der Fahrzeuge:', error));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    vehicles.forEach((vehicle) => {
      if (vehicle.destination && !movingVehicles.has(vehicle._id)) {
        moveVehicle(vehicle, (updatedVehicle) => {
          setVehicles((prevVehicles) =>
            prevVehicles.map((v) => (v._id === updatedVehicle._id ? updatedVehicle : v))
          );
        });
      }
    });
  }, [vehicles]);

  return (
    <MapContainer center={[49.6425, 11.2537]} zoom={13} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {stations.map((station) => (
        <Marker
          key={station._id}
          position={[station.location.latitude, station.location.longitude]}
          icon={
            station.type === 'Feuerwehr'
              ? fireStationIcon
              : station.type === 'Polizei'
              ? policeStationIcon
              : medicalStationIcon
          }
        >
          <Popup>
            <strong>{station.name}</strong>
            <br />
            Typ: {station.type}
          </Popup>
        </Marker>
      ))}
      {missions.map((mission) => (
        <Marker
          key={mission._id}
          position={[mission.location.latitude, mission.location.longitude]}
          icon={missionIcon}
        >
          <Popup>
            <strong>{mission.description}</strong>
            <br />
            Benötigte Fahrzeuge: {mission.requiredVehicles.join(', ')}
          </Popup>
        </Marker>
      ))}
      {vehicles
        .filter((vehicle) => vehicle.destination) // Nur Fahrzeuge mit Ziel anzeigen
        .map((vehicle) => (
          <Marker
            key={vehicle._id}
            position={[vehicle.location.latitude, vehicle.location.longitude]}
            icon={vehicleIcon}
          >
            <Popup>
              {vehicle.name}
              <br />
              Ziel: {vehicle.destinationType}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

export default MapComponent;
