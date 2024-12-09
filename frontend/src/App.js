import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import { MapProvider } from "./components/MapContext";
import MissionList from './components/MissionList';
import MissionDetail from './components/MissionDetail';
import VehicleManagement from './components/VehicleManagement';
import Statistics from './components/Statistics';
import StationManagement from './components/StationManagement';
import MissionGenerator from './components/MissionGenerator';

function App() {
  const [activeTab, setActiveTab] = useState('stations');
  const [selectedMission, setSelectedMission] = useState(null);

  return (
    <MapProvider>
    <div className="App">
      <div className="layout">
        {}
        <div className="map-section">
          <MapComponent />
        </div>

        {}
        <div className="details-section">
          <div className="tabs">
            <button
              className={activeTab === 'stations' ? 'active' : ''}
              onClick={() => setActiveTab('stations')}
            >
              Wachen
            </button>
            <button
              className={activeTab === 'missions' ? 'active' : ''}
              onClick={() => setActiveTab('missions')}
            >
              Einsätze
            </button>
            <button
              className={activeTab === 'vehicles' ? 'active' : ''}
              onClick={() => setActiveTab('vehicles')}
            >
              Fahrzeuge
            </button>
            <button
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              Statistiken
            </button>
            <button
              className={activeTab === 'generator' ? 'active' : ''}
              onClick={() => setActiveTab('generator')}
            >
              Optionen
            </button>
          </div>

          <div className="content">
            {selectedMission ? (
              <MissionDetail
                mission={selectedMission}
                onClose={() => setSelectedMission(null)} 
              />
            ) : (
              <>
                {activeTab === 'stations' && <StationManagement />}
                {activeTab === 'missions' && (
                  <MissionList
                    onSelectMission={(mission) => setSelectedMission(mission)}
                  />
                )}
                {activeTab === 'vehicles' && <VehicleManagement />}
                {activeTab === 'stats' && <Statistics />}
                {activeTab === 'generator' && <MissionGenerator />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </MapProvider>
  );
}

export default App;