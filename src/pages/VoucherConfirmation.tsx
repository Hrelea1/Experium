import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const VoucherConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const voucherCode = searchParams.get('code');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16">
        <div className="max-w-lg mx-auto">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center pb-8 pt-12">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-green-900 mb-2">
                Voucher Folosit!
              </CardTitle>
              <CardDescription className="text-base text-green-700">
                Voucher-ul tău a fost utilizat cu succes și rezervarea a fost creată
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-12">
              {voucherCode && (
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Cod voucher</p>
                  <p className="font-mono font-bold text-lg text-green-900">{voucherCode}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/my-bookings')} 
                  className="w-full"
                  size="lg"
                >
                  Vezi Rezervările Mele
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  Înapoi la Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoucherConfirmation;
