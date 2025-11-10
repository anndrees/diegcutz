import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Coordinates for Carrer Sant Antoni, Monóvar, Alicante
  const position: [number, number] = [38.4428, -0.8471];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Fix leaflet's default icon path issues with bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Init map
    mapInstance.current = L.map(mapRef.current, {
      center: position,
      zoom: 16,
      scrollWheelZoom: false,
    });

    // OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);

    // Marker
    L.marker(position).addTo(mapInstance.current)
      .bindPopup(
        `<div style="text-align:center">
          <strong style="font-size:14px">DIEGCUTZ</strong><br/>
          Carrer Sant Antoni<br/>
          Monóvar, Alicante<br/>
          03640, España
        </div>`
      );

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-primary glow-neon-purple">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default Map;
