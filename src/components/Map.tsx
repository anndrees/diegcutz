import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Mapbox public token - users should replace with their own
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTNraTY5OTYwOXZtMmtzNnNoa2V3cjRmIn0.RWbp02mcqP93k3_-N98Vrw';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-0.8456, 38.4389], // Monóvar coordinates
      zoom: 16,
    });

    // Add marker at barbershop location
    new mapboxgl.Marker({ color: '#00ffff' })
      .setLngLat([-0.8456, 38.4389])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML('<strong>DIEGCUTZ</strong><br>Carrer Sant Antoni<br>Monóvar, Alicante<br>03640')
      )
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-neon/30">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
