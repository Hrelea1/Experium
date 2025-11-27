import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Experience {
  id: string;
  title: string;
  price: number;
}

const VoucherBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [validity, setValidity] = useState<string>("12");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title, price')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca experiențele",
        variant: "destructive",
      });
    }
  };

  const createVoucher = async () => {
    if (!selectedExperience) {
      toast({
        title: "Date incomplete",
        description: "Te rog să selectezi o experiență",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-voucher', {
        body: {
          experienceId: selectedExperience,
          notes: notes || undefined,
          validityMonths: parseInt(validity),
        },
      });

      if (error) throw error;

      const voucherCode = data?.voucher?.code || 'N/A';
      
      toast({
        title: "Succes",
        description: `Voucher creat cu succes! Cod: ${voucherCode}`,
      });

      // Reset form
      setSelectedExperience("");
      setNotes("");
      setValidity("12");
      navigate('/admin/vouchers');
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea voucher-ul",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Generare Voucher</h2>
            <p className="text-muted-foreground">
              Creează un cod de voucher pentru o experiență
            </p>
          </div>
          <Gift className="h-8 w-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Creare Voucher</CardTitle>
            <CardDescription>
              Selectează o experiență pentru a genera un cod de voucher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experiență *</Label>
              <Select
                value={selectedExperience}
                onValueChange={setSelectedExperience}
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Selectează experiența" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.title} - {exp.price} RON
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Voucher-ul va folosi prețul experienței selectate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity">Perioadă Valabilitate (luni)</Label>
              <Input
                id="validity"
                type="number"
                placeholder="12"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Voucher-ul va fi valabil {validity} luni de la data emiterii
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notițe (opțional)</Label>
              <Textarea
                id="notes"
                placeholder="Adaugă notițe despre voucher..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Alert>
              <AlertDescription>
                După creare, codul voucher-ului va putea fi folosit de orice utilizator pentru a rezerva experiența selectată gratuit.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/admin/vouchers')}>
              Anulează
            </Button>
            <Button 
              onClick={createVoucher} 
              disabled={!selectedExperience || isCreating}
            >
              {isCreating ? "Se creează..." : "Generează Voucher"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default VoucherBuilder;
