import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Gift, Calendar as CalendarIcon, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VoucherDetails {
  voucherId: string;
  experienceId: string;
  experienceTitle: string;
  experienceLocation: string;
  experiencePrice: number;
  voucherCode: string;
}

const RedeemVoucher = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Step 1: Enter voucher code
  const [voucherCode, setVoucherCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  
  // Step 2: Validated voucher details
  const [voucherDetails, setVoucherDetails] = useState<VoucherDetails | null>(null);
  
  // Step 3: Booking details
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [participants, setParticipants] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Pre-fill voucher code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setVoucherCode(codeFromUrl);
    }
  }, [searchParams]);

  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: 'Eroare',
        description: 'Introdu codul voucher-ului',
        variant: 'destructive',
      });
      return;
    }

    setValidatingCode(true);

    try {
      const { data, error } = await supabase.rpc('validate_voucher_code', {
        voucher_code: voucherCode.trim().toUpperCase(),
      });

      if (error) throw error;

      const result = data[0];

      if (!result.is_valid) {
        toast({
          title: 'Voucher invalid',
          description: result.error_message,
          variant: 'destructive',
        });
        return;
      }

      // Fetch experience details
      const { data: experience, error: expError } = await supabase
        .from('experiences')
        .select('title, location_name, price')
        .eq('id', result.experience_id)
        .single();

      if (expError) throw expError;

      setVoucherDetails({
        voucherId: result.voucher_id,
        experienceId: result.experience_id,
        experienceTitle: experience.title,
        experienceLocation: experience.location_name,
        experiencePrice: experience.price,
        voucherCode: voucherCode.trim().toUpperCase(),
      });

      toast({
        title: 'Voucher validat!',
        description: 'Selectează data pentru rezervare',
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut valida voucher-ul',
        variant: 'destructive',
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const completeBooking = async () => {
    if (!voucherDetails || !selectedDate) {
      toast({
        title: 'Eroare',
        description: 'Selectează o dată pentru rezervare',
        variant: 'destructive',
      });
      return;
    }

    const participantsNum = parseInt(participants);
    if (isNaN(participantsNum) || participantsNum < 1) {
      toast({
        title: 'Eroare',
        description: 'Număr invalid de participanți',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('redeem_voucher', {
        p_voucher_id: voucherDetails.voucherId,
        p_booking_date: selectedDate.toISOString(),
        p_participants: participantsNum,
        p_special_requests: specialRequests || null,
      });

      if (error) throw error;

      const result = data[0];

      if (!result.success) {
        toast({
          title: 'Eroare',
          description: result.error_message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Rezervare confirmată!',
        description: 'Voucher-ul a fost utilizat cu succes',
      });

      // Navigate to bookings page
      navigate('/my-bookings');
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut finaliza rezervarea',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setVoucherDetails(null);
    setVoucherCode('');
    setSelectedDate(undefined);
    setParticipants('1');
    setSpecialRequests('');
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Folosește Voucher</h1>
            <p className="text-muted-foreground">
              Introdu codul voucher-ului pentru a face o rezervare
            </p>
          </div>

          {!voucherDetails ? (
            // Step 1: Enter Voucher Code
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Introdu Codul Voucher</CardTitle>
                    <CardDescription>
                      Codul se află pe voucher-ul tău (ex: EXP-2025-ABCD1234)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="voucher-code">Cod Voucher</Label>
                  <Input
                    id="voucher-code"
                    placeholder="EXP-2025-XXXXXXXX"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg"
                    maxLength={20}
                  />
                </div>

                <Button
                  onClick={validateVoucher}
                  disabled={validatingCode || !voucherCode.trim()}
                  className="w-full"
                  size="lg"
                >
                  {validatingCode ? 'Se verifică...' : 'Validează Voucher'}
                </Button>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Voucher-ul trebuie să fie activ și să aparțină contului tău
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Step 2 & 3: Experience Details & Booking Form
            <div className="space-y-6">
              {/* Experience Details */}
              <Card className="border-primary/50">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">
                        {voucherDetails.experienceTitle}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {voucherDetails.experienceLocation}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Validat</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cod voucher:</span>
                    <span className="font-mono font-bold">{voucherDetails.voucherCode}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalii Rezervare</CardTitle>
                  <CardDescription>
                    Selectează data și detaliile rezervării
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Data Experiență *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !selectedDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, 'PPP', { locale: undefined })
                          ) : (
                            <span>Selectează data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <Label htmlFor="participants">Număr Participanți</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="participants"
                        type="number"
                        min="1"
                        max="10"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="requests">Cerințe Speciale (opțional)</Label>
                    <Textarea
                      id="requests"
                      placeholder="Ex: Alergii, preferințe, sau întrebări..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {specialRequests.length}/500 caractere
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={resetFlow}
                      className="flex-1"
                    >
                      Anulează
                    </Button>
                    <Button
                      onClick={completeBooking}
                      disabled={submitting || !selectedDate}
                      className="flex-1"
                    >
                      {submitting ? 'Se procesează...' : 'Confirmă Rezervarea'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RedeemVoucher;
