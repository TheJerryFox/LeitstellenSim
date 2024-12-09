import React, { useEffect, useState, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { MapContext } from "./MapContext";

const statusEmojis = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  0: '0️⃣',
};

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

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

async function getRoute(start, destination) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_URL}/route/v1/driving/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    );
    return response.data.routes[0];
  } catch (error) {
    console.error('Fehler beim Abrufen der Route:', error);
    return null;
  }
}

const movingVehicles = new Set();
const routeCache = {};

const MapUpdater = () => {
  const { mapCenter } = useContext(MapContext);
  const map = useMap();

  useEffect(() => {
    console.log(mapCenter)
    map.flyTo(mapCenter.location, mapCenter.zoom);
  }, [mapCenter, map]);

  return null;
};

const MapComponent = ({ center }) => {
  const [stations, setStations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeData, setRouteData] = useState({ fullRoute: [], traveledRoute: [] });

  const moveVehicle = useCallback(async (vehicle, onUpdate) => {
    if (!vehicle.destination || movingVehicles.has(vehicle._id)) return;

    movingVehicles.add(vehicle._id);
    const cacheKey = `${vehicle._id}-${vehicle.destination}`;
    let coordinates;
    let destination;

    try {
      if (routeCache[cacheKey]) {
        coordinates = routeCache[cacheKey];
        destination = {
          latitude: coordinates[coordinates.length - 1][1],
          longitude: coordinates[coordinates.length - 1][0],
        };
      } else {
        const destinationDetails = await axios.get(
          `${process.env.REACT_APP_API_URL}/${vehicle.destinationType.toLowerCase()}s/${vehicle.destination}`
        );
        destination = destinationDetails.data.location;

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
          vehicle.status = vehicle.destinationType === 'Mission' ? 4 : 2;
          vehicle.location = destination;
          vehicle.destination = null;
          axios.patch(`${process.env.REACT_APP_API_URL}/vehicles/${vehicle._id}`, {
            status: vehicle.status,
            location: vehicle.location,
            destination: null,
          });
          delete routeCache[cacheKey];
          onUpdate(vehicle);
          movingVehicles.delete(vehicle._id);
          return;
        }
        const nextPosition = coordinates[index];
        vehicle.location = { latitude: nextPosition[1], longitude: nextPosition[0] };

        if (selectedVehicle?._id === vehicle._id) {
          setRouteData((prev) => ({
            fullRoute: prev.fullRoute.slice(index + 1),
            traveledRoute: [...prev.traveledRoute, prev.fullRoute[index]],
          }));
        }

        onUpdate(vehicle);

        index++;
      }, 1000);
    } catch (error) {
      console.error(`Fehler bei der Bewegung des Fahrzeugs ${vehicle.name}:`, error);
      movingVehicles.delete(vehicle._id);
    }
  }, [selectedVehicle]);

  const toggleRoute = async (vehicle) => {
    if (selectedVehicle?._id === vehicle._id) {
      setSelectedVehicle(null);
      setRouteData({ fullRoute: [], traveledRoute: [] });
    } else {
      setSelectedVehicle(vehicle);
      if (vehicle.destination) {
        const destinationDetails = await axios.get(
          `${process.env.REACT_APP_API_URL}/${vehicle.destinationType.toLowerCase()}s/${vehicle.destination}`
        );
        const destination = destinationDetails.data.location;

        const route = await getRoute(vehicle.location, destination);
        if (route) {
          setRouteData({ fullRoute: route.geometry.coordinates, traveledRoute: [] });
        }
      }
    }
  };

  useEffect(() => {
    const socket = io(process.env.REACT_SOCKET_URL, { path: '/socket.io' });

    socket.on('updateStations', (data) => setStations(data));
    socket.on('updateMissions', (data) => setMissions(data));
    socket.on('updateVehicles', (data) => setVehicles(data));

    axios
      .get(`${process.env.REACT_APP_API_URL}/stations`)
      .then((response) => setStations(response.data))
      .catch((error) => console.error('Fehler beim Abrufen der Wachen:', error));

    axios
      .get(`${process.env.REACT_APP_API_URL}/missions`)
      .then((response) => setMissions(response.data))
      .catch((error) => console.error('Fehler beim Abrufen der Einsätze:', error));

    axios
      .get(`${process.env.REACT_APP_API_URL}/vehicles`)
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
  }, [vehicles, moveVehicle]);

  return (
    <MapContainer center={[49.45, 11.09]} zoom={5} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MapUpdater />
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
      {vehicles.filter((vehicle) => vehicle.destination).map((vehicle) => (
        <Marker
          key={vehicle._id}
          position={[vehicle.location.latitude, vehicle.location.longitude]}
          icon={vehicleIcon}
        >
          <Popup>
            <strong>{vehicle.name}</strong>
            <br />
            Status {statusEmojis[vehicle.status]}
            <br />
            <button onClick={() => toggleRoute(vehicle)}>
              {selectedVehicle?._id === vehicle._id ? 'Route ausblenden' : 'Route anzeigen'}
            </button>
          </Popup>
        </Marker>
      ))}
      <Polyline
        positions={routeData.traveledRoute.map((coord) => [coord[1], coord[0]])}
        color="green"
      />
      <Polyline
        positions={routeData.fullRoute.map((coord) => [coord[1], coord[0]])}
        color="blue"
      />
    </MapContainer>
  );
};

export default MapComponent;