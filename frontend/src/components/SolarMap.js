import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler
const MapEvents = ({ onMapClick }) => {
  const map = useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100); // Fix map resize issues
  }, [map]);

  return null;
};

const SolarMap = ({ coordinates, onLocationSelect }) => {
  const [marker, setMarker] = useState(
    coordinates?.lat && coordinates?.lng ? [coordinates.lat, coordinates.lng] : null
  );

  // Update marker if parent coordinates change
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng) {
      setMarker([coordinates.lat, coordinates.lng]);
    } else {
      setMarker(null);
    }
  }, [coordinates]);

  const handleMapClick = (latlng) => {
    setMarker([latlng.lat, latlng.lng]);
    onLocationSelect(latlng.lat, latlng.lng);
  };

  const handleRemoveMarker = () => {
    setMarker(null);
    onLocationSelect(null, null); // Notify parent
  };

  return (
    <div
      style={{
        height: '500px',
        width: '100%',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid #334155',
      }}
    >
      <div
        style={{
          padding: '1rem',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0', fontSize: '1.125rem' }}>
            Select Location
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
            Click on the map or use coordinates above
          </p>
        </div>
        {marker && (
          <button
            onClick={handleRemoveMarker}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Remove Marker
          </button>
        )}
      </div>

      <MapContainer
        center={marker || [19.076, 72.8777]} // Default Mumbai
        zoom={8}
        minZoom={2}
        maxZoom={20}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        style={{ height: 'calc(100% - 80px)', width: '100%' }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution="&copy; Google"
          maxZoom={20}
        />
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
          attribution=""
          maxZoom={20}
        />
        <MapEvents onMapClick={handleMapClick} />
        {marker && <Marker position={marker} />}
      </MapContainer>
    </div>
  );
};

export default SolarMap;
