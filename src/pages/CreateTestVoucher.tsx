import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';

const CreateTestVoucher = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [selectedExperience, setSelectedExperience] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title, price')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setExperiences(data || []);
      
      if (data && data.length > 0) {
        setSelectedExperience(data[0].id);
        setPrice(data[0].price.toString());
      }
    } catch (error: any) {
      console.error('Error fetching experiences:', error);
    }
  };

  const createVoucher = async () => {
    if (!selectedExperience || !price) {
      toast({
        title: 'Eroare',
        description: 'Selectează o experiență și introdu prețul',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-voucher', {
        body: {
          experienceId: selectedExperience,
          purchasePrice: parseFloat(price),
          notes: 'Test voucher creat manual',
        },
      });

      if (error) throw error;

      toast({
        title: 'Succes!',
        description: 'Voucher-ul a fost creat cu succes',
      });

      navigate('/my-vouchers');
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut crea voucher-ul',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Creează Voucher Test</CardTitle>
                  <CardDescription>
                    Generează un voucher pentru testare
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="experience">Experiență</Label>
                <select
                  id="experience"
                  className="w-full border rounded-md p-2 bg-background"
                  value={selectedExperience}
                  onChange={(e) => {
                    setSelectedExperience(e.target.value);
                    const exp = experiences.find(ex => ex.id === e.target.value);
                    if (exp) setPrice(exp.price.toString());
                  }}
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} - {exp.price} RON
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preț (RON)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <Button
                onClick={createVoucher}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Se creează...' : 'Creează Voucher'}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Notă:</strong> Aceasta este o pagină de test pentru a crea vouchere.
                  În producție, voucherele vor fi generate automat la achiziție.
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

export default CreateTestVoucher;
