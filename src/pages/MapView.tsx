import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface MapExperience {
  id: string;
  title: string;
  location: string;
  price: number;
  coordinates: [number, number];
}

export default function MapView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [experiences, setExperiences] = useState<MapExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch experiences with coordinates from DB
    const fetchExperiences = async () => {
      const { data } = await supabase
        .from('experiences')
        .select('id, title, location_name, price, latitude, longitude')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (data) {
        setExperiences(
          data
            .filter((e: any) => e.latitude && e.longitude)
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              location: e.location_name,
              price: Number(e.price),
              coordinates: [Number(e.longitude), Number(e.latitude)] as [number, number],
            }))
        );
      }
      setIsLoading(false);
    };

    fetchExperiences();

    // Get user geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        () => {} // silently fail
      );
    }
  }, []);

  const handleExperienceClick = (experienceId: number | string) => {
    navigate(`/experience/${experienceId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="h-8 w-8 text-primary" />
                  {t('hero.showOnMap')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading
                    ? 'Se încarcă experiențele...'
                    : experiences.length === 0
                    ? 'Nu există experiențe cu coordonate'
                    : `${experiences.length} experiențe pe hartă`}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
            <Map
              experiences={experiences}
              userLocation={userLocation}
              onExperienceClick={handleExperienceClick}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
