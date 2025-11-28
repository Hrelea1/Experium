import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { allExperiences, type Experience } from '@/data/experiences';

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Romanian cities approximate coordinates for demo
const cityCoordinates: Record<string, [number, number]> = {
  'București': [26.1025, 44.4268],
  'Cluj-Napoca': [23.5886, 46.7712],
  'Brașov': [25.5887, 45.6577],
  'Timișoara': [21.2272, 45.7489],
  'Sibiu': [24.1525, 45.7983],
  'Constanța': [28.6348, 44.1598],
  'Sinaia': [25.5508, 45.3497],
  'Bran': [25.3673, 45.5145],
};

interface ExperienceWithCoords extends Experience {
  coordinates?: [number, number];
}

export default function MapView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [nearbyExperiences, setNearbyExperiences] = useState<ExperienceWithCoords[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    // Get user's geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(coords);
          setIsLoadingLocation(false);
          
          // Filter experiences by proximity (within 50km)
          const experiencesWithCoords = allExperiences.map(exp => {
            // Try to match location with known coordinates
            const cityMatch = Object.keys(cityCoordinates).find(city => 
              exp.location.toLowerCase().includes(city.toLowerCase())
            );
            
            if (cityMatch) {
              return {
                ...exp,
                coordinates: cityCoordinates[cityMatch] as [number, number],
              };
            }
            return exp;
          }).filter(exp => {
            if (!('coordinates' in exp) || !exp.coordinates) return false;
            const distance = calculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              exp.coordinates[1],
              exp.coordinates[0]
            );
            return distance <= 50; // Within 50km
          }) as ExperienceWithCoords[];

          setNearbyExperiences(experiencesWithCoords);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
          // Show all experiences if location access denied
          const experiencesWithCoords = allExperiences.map(exp => {
            const cityMatch = Object.keys(cityCoordinates).find(city => 
              exp.location.toLowerCase().includes(city.toLowerCase())
            );
            if (cityMatch) {
              return {
                ...exp,
                coordinates: cityCoordinates[cityMatch] as [number, number],
              };
            }
            return exp;
          }).filter(exp => 'coordinates' in exp && exp.coordinates) as ExperienceWithCoords[];
          
          setNearbyExperiences(experiencesWithCoords);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, []);

  const handleExperienceClick = (experienceId: number) => {
    navigate(`/experience/${experienceId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="h-8 w-8 text-primary" />
                  {t('hero.showOnMap')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoadingLocation
                    ? 'Detecting your location...'
                    : nearbyExperiences.length === 0
                    ? 'No experiences found nearby'
                    : `${nearbyExperiences.length} experiences near you`}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden">
            <Map
              experiences={nearbyExperiences}
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
