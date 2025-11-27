import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Gift, Search } from 'lucide-react';
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

const VoucherBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');

  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [validityMonths, setValidityMonths] = useState('12');

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('id, title, price')
      .eq('is_active', true)
      .order('title');

    setExperiences(data || []);
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'Eroare',
        description: 'Introdu un email pentru căutare',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${searchEmail.trim()}%`)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Niciun rezultat',
          description: 'Nu s-au găsit utilizatori cu acest email',
        });
        return;
      }

      setUsers(data);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExperienceChange = (expId: string) => {
    setSelectedExperience(expId);
    const exp = experiences.find((e) => e.id === expId);
    if (exp) {
      setPrice(exp.price.toString());
    }
  };

  const createVoucher = async () => {
    if (!selectedUser || !selectedExperience || !price) {
      toast({
        title: 'Eroare',
        description: 'Completează toate câmpurile obligatorii',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-voucher', {
        body: {
          userId: selectedUser,
          experienceId: selectedExperience,
          purchasePrice: parseFloat(price),
          notes: notes || null,
          validityMonths: parseInt(validityMonths),
        },
      });

      if (error) throw error;

      toast({
        title: 'Succes!',
        description: 'Voucher-ul a fost creat',
      });

      navigate('/admin/orders');
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut crea voucher-ul',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Creare Voucher</h2>
            <p className="text-muted-foreground">
              Generează un voucher pentru un client
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/orders')}>
            Anulează
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Detalii Voucher</CardTitle>
                <CardDescription>Selectează utilizatorul și experiența</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Search */}
            <div className="space-y-2">
              <Label htmlFor="search-email">Caută Utilizator</Label>
              <div className="flex gap-2">
                <Input
                  id="search-email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="email@utilizator.com"
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} variant="secondary">
                  <Search className="h-4 w-4 mr-2" />
                  Caută
                </Button>
              </div>
            </div>

            {/* User Selection */}
            {users.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="user">Selectează Utilizator *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Alege utilizator" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Experience Selection */}
            <div className="space-y-2">
              <Label htmlFor="experience">Experiență *</Label>
              <Select value={selectedExperience} onValueChange={handleExperienceChange}>
                <SelectTrigger id="experience">
                  <SelectValue placeholder="Selectează experiență" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      {exp.title} - {exp.price} RON
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price & Validity */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Valoare (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="299.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Valabilitate (luni)</Label>
                <Input
                  id="validity"
                  type="number"
                  value={validityMonths}
                  onChange={(e) => setValidityMonths(e.target.value)}
                  placeholder="12"
                  min="1"
                  max="24"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opțional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notițe despre acest voucher..."
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/orders')}
              >
                Anulează
              </Button>
              <Button onClick={createVoucher} disabled={creating}>
                {creating ? 'Se creează...' : 'Creează Voucher'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default VoucherBuilder;
