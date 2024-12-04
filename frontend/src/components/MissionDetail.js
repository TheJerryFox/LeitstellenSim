import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

function MissionDetail({ mission, onClose }) {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicles, setSelectedVehicles] = useState([]);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/vehicles`)
            .then((response) => {
                setVehicles(response.data);
            })
            .catch((error) => {
                console.error('Fehler beim Abrufen der Fahrzeuge:', error);
            });
    }, []);

    const dispatchVehicles = () => {
        selectedVehicles.forEach(vehicle => {
            console.log(`Mission ID ist ${mission._id}`)
            axios.patch(`${process.env.REACT_APP_API_URL}/vehicles/${vehicle._id}`, { 
                status: 3, 
                destination: mission._id, 
                destinationType: 'Mission' 
            })
            .then(() => console.log(`Fahrzeug ${vehicle.name} zu ${mission._id} entsandt.`))
            .catch(error => console.error(`Fehler beim Senden des Fahrzeugs ${vehicle.name}:`, error));
        });
    
        axios.patch(`${process.env.REACT_APP_API_URL}/missions/${mission._id}`, { 
            assignedVehicles: selectedVehicles.map(v => v._id),
            status: 'in Bearbeitung' 
        })
        .then(() => console.log('Einsatzstatus aktualisiert.'))
        .catch(error => console.error('Fehler beim Aktualisieren des Einsatzstatus:', error));
        
        onClose();
    };    

    return (
        <div>
            <h2>Einsatzdetails</h2>
            <p><strong>{mission.description}</strong></p>
            <p>Ort: {mission.location.latitude}, {mission.location.longitude}</p>
            <p>Benötigte Fahrzeuge: {mission.requiredVehicles.join(', ')}</p>
            <h3>Verfügbare Fahrzeuge:</h3>
            <ul>
                {vehicles.map(vehicle => (
                    <li key={vehicle._id}>
                        <input
                            type="checkbox"
                            value={vehicle._id}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedVehicles([...selectedVehicles, vehicle]);
                                } else {
                                    setSelectedVehicles(selectedVehicles.filter(v => v._id !== vehicle._id));
                                }
                            }}
                        />
                        {vehicle.name} ({vehicle.type}) - Status: {statusEmojis[vehicle.status]}
                    </li>
                ))}
            </ul>
            <button onClick={dispatchVehicles}>Fahrzeuge alarmieren</button>
            <button onClick={onClose}>Schließen</button>
        </div>
    );
}

export default MissionDetail;