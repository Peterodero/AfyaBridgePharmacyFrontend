import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Component to refocus map when coordinates change
const RecenterMap = ({ coords }) => {
  const map = useMap();
  map.setView(coords, 15);
  return null;
};

export const LocationPicker = ({ position, setPosition }) => {
  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([
        Number.parseFloat(pos.coords.latitude.toFixed(6)),
        Number.parseFloat(pos.coords.longitude.toFixed(6)),
      ]);
    });
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between mb-2">
        <label className="form-label small fw-bold">GPS Location</label>
        <button type="button" onClick={detectLocation} className="btn btn-sm btn-outline-primary">
          Detect Location
        </button>
      </div>
      <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} />
          <RecenterMap coords={position} />
        </MapContainer>
      </div>
    </div>
  );
};