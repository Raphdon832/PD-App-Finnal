import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
  height = 220,
  readOnly = false,
  center = { lat: 9.0765, lng: 7.3986 },
  zoom = 12,
}) {
  const pos = value || center;
  return (
    <div className="rounded-xl overflow-hidden border">
      <MapContainer
        center={[pos.lat, pos.lng]}
        zoom={zoom}
        style={{ height }}
        scrollWheelZoom={!readOnly}
        doubleClickZoom={!readOnly}
        dragging={!readOnly}
        zoomControl={!readOnly}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pos.lat, pos.lng]} icon={markerIcon} />
        {!readOnly && (
          <ClickCapture
            onPick={(p) => onChange && onChange(p)}
          />
        )}
      </MapContainer>
    </div>
  );
}
