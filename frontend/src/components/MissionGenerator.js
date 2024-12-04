import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MissionGenerator() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [missionCount, setMissionCount] = useState(1);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/stations`).then((response) => {
      setStations(response.data);
    });
  }, []);

  const generateMissions = async () => {
    if (!selectedStation) {
        alert("Bitte eine Wache auswählen.");
        return;
    }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/missions/generate`, {
            wacheId: selectedStation,
            anzahl: missionCount,
        });
        alert(response.data.message);
    } catch (error) {
        console.error('Fehler beim Generieren der Einsätze:', error.response?.data || error.message);
        alert(`Fehler: ${error.response?.data?.error || error.message}`);
    }
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
