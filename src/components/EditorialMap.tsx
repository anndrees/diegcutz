import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./editorial-map.css";

// Verified coordinates from the existing shared Google Maps link.
const POSITION: L.LatLngTuple = [38.438321, -0.838865];

export default function EditorialMap() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { center: POSITION, zoom: 16, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    L.marker(POSITION, {
      icon: L.divIcon({ className: "editorial-map__pin", html: "<span><b>DC</b></span>", iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] }),
    }).addTo(map).bindPopup('<strong>DIEGCUTZ.</strong>Carrer Sant Antoni · Monóvar<br><a href="https://maps.app.goo.gl/H1wTD6r3dBjsqRHA7" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a>');
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(ref.current);
    return () => { observer.disconnect(); map.remove(); };
  }, []);
  return <div className="editorial-map"><div ref={ref} aria-label="Ubicación de DIEGCUTZ en Monóvar" /></div>;
}