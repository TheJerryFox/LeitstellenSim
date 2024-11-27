import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MissionList({ onSelectMission }) {
    const [missions, setMissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:5000/api/missions')
            .then((response) => {
                setMissions(response.data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Fehler beim Abrufen der Einsätze:', error);
                setIsLoading(false);
            });
    }, []);

    return (
        <div>
            <h2>Einsätze</h2>
            {isLoading ? (
                <p>Wird geladen...</p>
            ) : (
                <ul>
                    {missions.map(mission => (
                        <li key={mission._id}>
                            <strong>{mission.description}</strong>
                            <br />
                            Ort: {mission.location.latitude}, {mission.location.longitude}
                            <br />
                            Status: {mission.status}
                            <br />
                            Benötigte Fahrzeuge: {mission.requiredVehicles.join(', ')}
                            Zugewiesene Fahrzeuge: {mission.assignedVehicles.map(v => v.name).join(', ') || 'Keine'}
                            <br />
                            <button onClick={() => onSelectMission(mission)}>Ansehen</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default MissionList;
