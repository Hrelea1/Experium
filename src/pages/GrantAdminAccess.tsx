import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GrantAdminAccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [granting, setGranting] = useState(false);

  const grantAdminAccess = async () => {
    if (!user) {
      toast({
        title: 'Eroare',
        description: 'Trebuie să fii autentificat',
        variant: 'destructive',
      });
      return;
    }

    setGranting(true);

    try {
      // Insert admin role for current user
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin',
        });

      if (error) {
        // Check if role already exists
        if (error.code === '23505') { // Unique violation
          toast({
            title: 'Info',
            description: 'Deja ai rol de admin',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Succes!',
          description: 'Acces admin acordat cu succes',
        });
      }

      // Navigate to admin panel
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut acorda acces admin',
        variant: 'destructive',
      });
    } finally {
      setGranting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Trebuie să fii autentificat pentru a accesa această pagină
              </p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/auth')}
              >
                Autentifică-te
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenție - Doar pentru Testare</AlertTitle>
            <AlertDescription>
              Această pagină este destinată exclusiv testării și nu ar trebui să fie
              accesibilă în producție. În aplicații reale, rolurile de admin ar trebui
              acordate doar prin procese securizate.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Acordă Acces Admin</CardTitle>
                  <CardDescription>
                    Folosește această funcție pentru a-ți acorda acces la panoul de administrare
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Utilizator:</span>{' '}
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Ce vei putea face ca admin:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Gestionezi toate experiențele</li>
                    <li>Vezi și administrezi toate rezervările</li>
                    <li>Gestionezi voucherele și comenzile</li>
                    <li>Accesezi statistici detaliate</li>
                    <li>Gestionezi utilizatorii platformei</li>
                  </ul>
                </div>

                <Button
                  onClick={grantAdminAccess}
                  disabled={granting}
                  className="w-full"
                  size="lg"
                >
                  {granting ? 'Se acordă acces...' : 'Acordă-mi Acces Admin'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Notă:</strong> După acordarea accesului, vei fi redirecționat
                  automat către panoul de administrare. Poți accesa panoul oricând din
                  meniul utilizatorului.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GrantAdminAccess;
