import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function MissionList({ onSelectMission }) {
    const [missions, setMissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const socket = io(process.env.REACT_SOCKET_URL, { autoConnect: false });
        
        axios.get(`${process.env.REACT_APP_API_URL}/missions`)
            .then((response) => {
                setMissions(response.data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Fehler beim Abrufen der Einsätze:', error);
                setIsLoading(false);
            });

        axios.get(`${process.env.REACT_APP_API_URL}/vehicles`)
            .then((response) => {
                setVehicles(response.data);
            })
            .catch((error) => {
                console.error('Fehler beim Abrufen der Fahrzeuge:', error);
            });

        socket.on('updateMissions', (data) => setMissions(data));
        socket.on('updateVehicles', (data) => setVehicles(data));
    }, []);

    return (
        <div>
            {isLoading ? (
                <p>Wird geladen...</p>
            ) : (
                <div className="mission-list-container">
                    {missions.map((mission) => (
                        <div
                            className={`mission-item ${
                                mission.status === 'offen'
                                    ? 'mission-status-open'
                                    : mission.status === 'in Bearbeitung'
                                    ? 'mission-status-in-progress'
                                    : 'mission-status-completed'
                            }`}
                            key={mission._id}
                        >
                            <strong>{mission.description}</strong>
                            <div className="details">
                                Ort: {mission.location.latitude}, {mission.location.longitude}
                                <br />
                                Status: {mission.status}
                                <br />
                                Benötigte Fahrzeuge: {mission.requiredVehicles.join(', ')}
                                <br />
                                Zugewiesene Fahrzeuge: {mission.assignedVehicles.map((v) => {
                                    const vehicle = vehicles.find((vehicle) => vehicle._id === v);
                                    return vehicle ? vehicle.name : "Unbekanntes Fahrzeug";
                                }).join(', ') || 'Keine'}
                            </div>
                            <button onClick={() => onSelectMission(mission)}>Ansehen</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MissionList;
