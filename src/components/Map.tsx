import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Experience {
  id: number | string;
  title: string;
  location: string;
  price: number;
  image?: string;
  coordinates?: [number, number];
}

interface MapProps {
  experiences: Experience[];
  userLocation?: [number, number];
  onExperienceClick?: (experienceId: number | string) => void;
}

const Map = ({ experiences, userLocation, onExperienceClick }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setError('Nu s-a putut încărca harta');
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError('Token Mapbox nu este configurat');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Eroare la încărcarea hărții');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
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
        .setPopup(new mapboxgl.Popup().setHTML('<p>Locația ta</p>'))
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
                <p style="color: #8B5CF6; font-weight: bold;">${experience.price} lei</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">Se încarcă harta...</p>
        </div>
      </div>
    );
  }

  if (error || !mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            {error || 'Harta nu este disponibilă'}
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
