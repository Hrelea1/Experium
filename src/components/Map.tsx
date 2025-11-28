import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Experience {
  id: number;
  title: string;
  location: string;
  price: number;
  image?: string;
  coordinates?: [number, number];
}

interface MapProps {
  experiences: Experience[];
  userLocation?: [number, number];
  onExperienceClick?: (experienceId: number) => void;
}

const Map = ({ experiences, userLocation, onExperienceClick }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Get token from environment or secrets
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (token) {
      setMapboxToken(token);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Initialize map centered on Romania or user location
    const center = userLocation || [25.0, 45.9]; // Romania center as fallback
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: userLocation ? 10 : 6,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add user location marker if available
    if (userLocation) {
      new mapboxgl.Marker({ color: '#0EA5E9' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<p>Your Location</p>'))
        .addTo(map.current);
    }

    // Add markers for experiences
    experiences.forEach((experience) => {
      if (experience.coordinates && map.current) {
        const el = document.createElement('div');
        el.className = 'experience-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#8B5CF6';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const marker = new mapboxgl.Marker(el)
          .setLngLat(experience.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${experience.title}</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 4px;">${experience.location}</p>
                <p style="color: #8B5CF6; font-weight: bold;">${experience.price} RON</p>
              </div>`
            )
          )
          .addTo(map.current);

        el.addEventListener('click', () => {
          if (onExperienceClick) {
            onExperienceClick(experience.id);
          }
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, experiences, userLocation, onExperienceClick]);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Map requires Mapbox token to be configured.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please add MAPBOX_TOKEN to your secrets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
    </div>
  );
};

export default Map;
