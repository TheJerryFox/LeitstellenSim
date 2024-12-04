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
  0: '0️⃣',
};

function VehicleManagement({ toggleRoute, selectedVehicle }) {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_URL, { autoConnect: false });

    axios
      .get(`${process.env.REACT_APP_API_URL}/vehicles`)
      .then((response) => {
        setVehicles(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Fehler beim Abrufen der Fahrzeuge:', error);
        setIsLoading(false);
      });

    socket.on('updateVehicles', (updatedVehicles) => setVehicles(updatedVehicles));

    return () => socket.disconnect();
  }, []);

  const deleteVehicle = (id) => {
    if (window.confirm('Möchtest du dieses Fahrzeug wirklich löschen?')) {
      axios
        .delete(`${process.env.REACT_APP_API_URL}/vehicles/${id}`)
        .then(() => {
          setVehicles((prevVehicles) => prevVehicles.filter((vehicle) => vehicle._id !== id));
        })
        .catch((error) => {
          console.error('Fehler beim Löschen des Fahrzeugs:', error);
          alert('Fehler beim Löschen des Fahrzeugs. Bitte versuche es erneut.');
        });
    }
  };

  return (
    <div>
      {isLoading ? (
        <p>Wird geladen...</p>
      ) : (
        <div className="mission-list-container">
            {vehicles.map((vehicle) => (
                <div className="mission-item" key={vehicle._id}>
                    <strong>{vehicle.name}</strong>
                    <div className="details">
                        Status {statusEmojis[vehicle.status]}
                        <br />
                        {vehicle.type}
                    </div>
                    <button onClick={() => deleteVehicle(vehicle._id)}>Löschen</button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;
