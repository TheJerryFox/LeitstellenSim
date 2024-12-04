import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function StationManagement() {
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_URL, { autoConnect: false });

        axios.get(`${process.env.REACT_APP_API_URL}/stations`)
        .then((response) => {
            setStations(response.data);
            setIsLoading(false);
        })
        .catch((error) => {
            console.error('Fehler beim Abrufen der Wachen:', error);
            setIsLoading(false);
        });

        socket.on('updateStations', (updatedStations) => setStations(updatedStations));

        return () => socket.disconnect();
    }, []);

    const deleteStation = (id) => {
        if (window.confirm('Möchtest du diese Wache wirklich löschen?')) {
        axios
            .delete(`${process.env.REACT_APP_API_URL}/stations/${id}`)
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
            {isLoading ? (
                <p>Wird geladen...</p>
            ) : (
                <div className="station-list-container">
                    {stations.map((station) => (
                        <div className="station-item" key={station._id}>
                            <strong>{station.name}</strong>
                            <div className="details">
                                {station.type}
                                <br />
                                Standort: {station.location.latitude}, {station.location.longitude}
                            </div>
                            <button onClick={() => deleteStation(station._id)}>Löschen</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StationManagement;
