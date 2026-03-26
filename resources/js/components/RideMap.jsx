import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon paths for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function RideMap({ pickup, dropoff, height = 400 }) {
    if (!pickup || !dropoff) {
        return null;
    }

    const centerLat = (pickup.lat + dropoff.lat) / 2;
    const centerLng = (pickup.lng + dropoff.lng) / 2;

    return (
        <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height, width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[pickup.lat, pickup.lng]}>
                <Popup>
                    Pickup<br />{pickup.address}
                </Popup>
            </Marker>
            <Marker position={[dropoff.lat, dropoff.lng]}>
                <Popup>
                    Dropoff<br />{dropoff.address}
                </Popup>
            </Marker>
        </MapContainer>
    );
}
