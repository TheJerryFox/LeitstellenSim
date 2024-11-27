import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const statusEmojis = {
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    0: '0️⃣'
};

function VehicleManagement() {
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_URL);

        axios.get('http://localhost:5000/api/vehicles')
            .then((response) => {
                setVehicles(response.data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Fehler beim Abrufen der Fahrzeuge:', error);
                setIsLoading(false);
            });

        socket.on('updateVehicles', (updatedVehicles) => {
            setVehicles(updatedVehicles);
        });

        return () => socket.disconnect();
    }, []);

    const deleteVehicle = (id) => {
        if (window.confirm('Möchtest du dieses Fahrzeug wirklich löschen?')) {
            axios.delete(`http://localhost:5000/api/vehicles/${id}`).then(() => {
                setVehicles(vehicles.filter(vehicle => vehicle._id !== id));
            })
            .catch((error) => {
                console.error('Fehler beim Löschen des Fahrzeugs:', error);
                alert('Fehler beim Löschen des Fahrzeugs. Bitte versuche es erneut.');
            });
        }
    };

    return (
        <div>
            <h2>Fahrzeuge</h2>
            {isLoading ? (
                <p>Wird geladen...</p>
            ) : (
                <ul>
                    {vehicles.map(vehicle => (
                        <li key={vehicle._id}>
                            {vehicle.name} ({vehicle.type}) - {statusEmojis[vehicle.status]}
                            <button onClick={() => deleteVehicle(vehicle._id)}>Löschen</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default VehicleManagement;
