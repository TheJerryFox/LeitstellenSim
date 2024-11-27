import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function StationManagement() {
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_URL);

        axios.get('http://localhost:5000/api/stations')
        .then((response) => {
            setStations(response.data);
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('Fehler beim Abrufen der Wachen:', error);
            setIsLoading(false);
        });

        socket.on('updateStations', (updatedStations) => {
            setStations(updatedStations);
        });

        return () => socket.disconnect();
    }, []);

    const deleteStation = (id) => {
        if (window.confirm('Möchtest du diese Wache wirklich löschen?')) {
        axios
            .delete(`http://localhost:5000/api/stations/${id}`)
            .then(() => {
                setStations(stations.filter((station) => station._id !== id));
                alert('Wache erfolgreich gelöscht.');
            })
            .catch((error) => {
                console.error('Fehler beim Löschen der Wache:', error);
                alert('Fehler beim Löschen der Wache. Bitte versuche es erneut.');
            });
        }
    };

    return (
        <div>
        <h2>Wachen</h2>
        {isLoading ? (
            <p>Wird geladen...</p>
        ) : (
            <ul>
            {stations.map((station) => (
                <li key={station._id}>
                {station.name} ({station.type}) - Standort: {station.location.latitude}, {station.location.longitude}
                <button onClick={() => deleteStation(station._id)}>Löschen</button>
                </li>
            ))}
            </ul>
        )}
        </div>
    );
}

export default StationManagement;
