import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContext } from "./MapContext";

function StationManagement() {
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setMapCenter } = useContext(MapContext);

    useEffect(() => {
        const socket = io(process.env.REACT_SOCKET_URL, { path: '/socket.io', autoConnect: false });

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

    const viewStation = (id) => {
        window.alert('Hier könnnten ihre Wachdetails stehen.')
    };

    const changeMapCenter = (location, zoom) => {
        setMapCenter({ location, zoom }); 
    };

    return (
        <div>
            {isLoading ? (
                <p>Wird geladen...</p>
            ) : (
                <div className="station-list-container">
                    {stations.map((station) => (
                        <div className="station-item" key={station._id} onClick={() => changeMapCenter([station.location.latitude, station.location.longitude], 17)}>
                            <strong>{station.name}</strong>
                            <div className="details">
                                {station.type}
                                <br />
                                Standort: {station.location.latitude}, {station.location.longitude}
                            </div>
                            <button onClick={() => deleteStation(station._id)}>Löschen</button>
                            <button onClick={() => viewStation(station._id)}>Details</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StationManagement;
