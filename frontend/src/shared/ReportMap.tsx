import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface Coordinates {
  latitude: number
  longitude: number
}

const tileUrl =
  import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution =
  import.meta.env.VITE_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function ClickSelector({ onSelect }: { onSelect: (position: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    },
  })
  return null
}

function ViewSync({ position }: { position: Coordinates | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.latitude, position.longitude], Math.max(map.getZoom(), 12))
  }, [map, position])
  return null
}

export function ReportMap({
  position,
  onSelect,
}: {
  position: Coordinates | null
  onSelect: (position: Coordinates) => void
}) {
  const centre: [number, number] = position
    ? [position.latitude, position.longitude]
    : [51.505, -0.09]
  return (
    <div className="report-map" aria-label="Mapa para selecionar a localização da denúncia">
      <MapContainer center={centre} zoom={position ? 13 : 11} scrollWheelZoom={false}>
        <TileLayer url={tileUrl} attribution={attribution} maxZoom={19} />
        <ClickSelector onSelect={onSelect} />
        <ViewSync position={position} />
        {position && (
          <CircleMarker
            center={[position.latitude, position.longitude]}
            radius={9}
            pathOptions={{ color: '#173b2b', fillColor: '#d9aa67', fillOpacity: 0.9 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
