import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Estilos personalizados para el mapa
const mapStyle = `
  .leaflet-container {
    background-color: #0a0a1a !important;
  }
  
  .leaflet-tile {
    filter: brightness(0.8) contrast(1.1) saturate(1.3) !important;
  }
  
  /* Efecto neón en las calles */
  .leaflet-tile-pane {
    filter: drop-shadow(0 0 2px #06d0f9) drop-shadow(0 0 4px #b447eb);
  }
  
  /* Estilo para las áreas verdes y agua */
  .leaflet-tile path[fill="#e0e0e0"], 
  .leaflet-tile path[fill="#f5f5f5"] {
    fill: #1a1a2e !important;
  }
  
  /* Estilo para las calles */
  .leaflet-tile path[stroke="#ffffff"],
  .leaflet-tile path[stroke="#f2f2f2"] {
    stroke: #06d0f9 !important;
    stroke-width: 1px !important;
    filter: drop-shadow(0 0 2px #06d0f9);
  }
  
  /* Estilo para las carreteras principales */
  .leaflet-tile path[stroke="#e6e6e6"] {
    stroke: #b447eb !important;
    stroke-width: 2px !important;
    filter: drop-shadow(0 0 3px #b447eb);
  }
  
  /* Estilo para el popup */
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background-color: #0a0a1a;
    color: #06d0f9;
    border: 1px solid #b447eb;
    box-shadow: 0 0 10px #b447eb, 0 0 20px #b447eb, 0 0 30px #b447eb;
  }
  
  .leaflet-popup-content-wrapper a {
    color: #b447eb;
  }
  
  .leaflet-popup-tip {
    background: #0a0a1a;
  }
`;

// Crear un estilo personalizado para el marcador
const createCustomMarker = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, #06d0f9 0%, #b447eb 100%);
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px #06d0f9, 0 0 20px #b447eb;
        position: relative;
      ">
        <div style="
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 5px #06d0f9, 0 0 10px #b447eb;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        ${mapStyle}
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const Map = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Coordinates for Carrer Sant Antoni, Monóvar, Alicante
  const position: [number, number] = [38.438264, -0.838957];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Fix leaflet's default icon path issues with bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Init map
    mapInstance.current = L.map(mapRef.current, {
      center: position,
      zoom: 16,
      scrollWheelZoom: false,
    });

    // Usar capa de OpenStreetMap estándar para mejor personalización
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Crear marcador personalizado
    L.marker(position, {
      icon: createCustomMarker(),
    })
      .addTo(mapInstance.current)
      .bindPopup(
        `<div style="
          text-align: center;
          color: #06d0f9;
          text-shadow: 0 0 5px #b447eb, 0 0 10px #b447eb;
        ">
          <strong style="font-size:16px; color: #b447eb; text-shadow: 0 0 5px #06d0f9;">DIEGCUTZ</strong><br/>
          <span style="color: #06d0f9;">Carrer Sant Antoni</span><br/>
          <span style="color: #06d0f9;">Monóvar, Alicante</span><br/>
          <span style="color: #b447eb;">03640, España</span>
        </div>`
      );

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-[#06d0f9] shadow-[0_0_5px_#06d0f9,0_0_10px_#b447eb,0_0_15px_#06d0f9,0_0_20px_#b447eb]">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default Map;
