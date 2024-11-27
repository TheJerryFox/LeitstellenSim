import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MissionGenerator() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [missionCount, setMissionCount] = useState(1);

  // Wachen abrufen
  useEffect(() => {
    axios.get('http://localhost:5000/api/stations').then((response) => {
      setStations(response.data);
    });
  }, []);

  // Einsätze generieren
  const generateMissions = () => {
    if (!selectedStation) {
        alert("Bitte eine Wache auswählen.");
        return;
    }      
    axios
      .post('http://localhost:5000/api/missions/generate', {
        wacheId: selectedStation,
        anzahl: missionCount
      })
      .then((response) => {
        alert(`${response.data.length} Einsätze erfolgreich generiert!`);
      })
      .catch((error) => {
        console.error('Fehler beim Generieren der Einsätze:', error.response?.data || error.message);
        alert(`Fehler: ${error.response?.data?.details || error.message}`);
      });
  };

  return (
    <div>
      <h2>Einsätze generieren</h2>
      <select
        value={selectedStation}
        onChange={(e) => setSelectedStation(e.target.value)}
      >
        <option value="">Wache auswählen</option>
        {stations.map((station) => (
          <option key={station._id} value={station._id}>
            {station.name} ({station.type})
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        max="10"
        value={missionCount}
        onChange={(e) => setMissionCount(e.target.value)}
      />
      <button onClick={generateMissions}>Generieren</button>
    </div>
  );
}

export default MissionGenerator;
