import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, QrCode, Gift, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

interface Voucher {
  id: string;
  code: string;
  status: string;
  issue_date: string;
  expiry_date: string;
  redemption_date?: string;
  purchase_price: number;
  qr_code_data?: string;
  notes?: string;
  experiences?: {
    title: string;
    location_name: string;
  };
}

const MyVouchers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchVouchers();
    }
  }, [user]);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          experiences (
            title,
            location_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVouchers(data || []);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca voucherele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (code: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const downloadVoucherPDF = async (voucher: Voucher) => {
    try {
      const qrCode = await generateQRCode(voucher.code);
      
      const pdf = new jsPDF();
      
      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(79, 70, 229); // Primary color
      pdf.text('Experium', 20, 20);
      
      // Add voucher title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Voucher Cadou', 20, 40);
      
      // Add experience details
      if (voucher.experiences) {
        pdf.setFontSize(14);
        pdf.text(`Experiență: ${voucher.experiences.title}`, 20, 55);
        pdf.text(`Locație: ${voucher.experiences.location_name}`, 20, 65);
      }
      
      // Add voucher details
      pdf.setFontSize(12);
      pdf.text(`Cod voucher: ${voucher.code}`, 20, 80);
      pdf.text(`Valoare: ${voucher.purchase_price} RON`, 20, 90);
      pdf.text(`Valabil până la: ${new Date(voucher.expiry_date).toLocaleDateString('ro-RO')}`, 20, 100);
      
      // Add QR code
      if (qrCode) {
        pdf.addImage(qrCode, 'PNG', 20, 110, 60, 60);
      }
      
      // Add instructions
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Prezintă acest cod pentru a rezerva experiența.', 20, 180);
      pdf.text('Pentru rezervare, accesează site-ul Experium și introdu codul.', 20, 190);
      
      // Save PDF
      pdf.save(`voucher-${voucher.code}.pdf`);
      
      toast({
        title: 'Succes',
        description: 'Voucher-ul a fost descărcat',
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut genera PDF-ul',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activ', variant: 'default' as const, icon: CheckCircle },
      used: { label: 'Utilizat', variant: 'secondary' as const, icon: CheckCircle },
      expired: { label: 'Expirat', variant: 'destructive' as const, icon: XCircle },
      exchanged: { label: 'Schimbat', variant: 'outline' as const, icon: Gift },
      transferred: { label: 'Transferat', variant: 'outline' as const, icon: Gift },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterVouchersByStatus = (status: string[]) => {
    return vouchers.filter((v) => status.includes(v.status));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Se încarcă voucherele...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Voucherele Mele</h1>
            <p className="text-muted-foreground">
              Gestionează și folosește voucherele tale cadou
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Toate ({vouchers.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({filterVouchersByStatus(['active']).length})
              </TabsTrigger>
              <TabsTrigger value="used">
                Utilizate ({filterVouchersByStatus(['used']).length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expirate ({filterVouchersByStatus(['expired']).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <VoucherGrid 
                vouchers={vouchers} 
                onDownload={downloadVoucherPDF}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="active">
              <VoucherGrid 
                vouchers={filterVouchersByStatus(['active'])} 
                onDownload={downloadVoucherPDF}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="used">
              <VoucherGrid 
                vouchers={filterVouchersByStatus(['used'])} 
                onDownload={downloadVoucherPDF}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="expired">
              <VoucherGrid 
                vouchers={filterVouchersByStatus(['expired'])} 
                onDownload={downloadVoucherPDF}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

interface VoucherGridProps {
  vouchers: Voucher[];
  onDownload: (voucher: Voucher) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

const VoucherGrid = ({ vouchers, onDownload, getStatusBadge }: VoucherGridProps) => {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    const generateAllQRCodes = async () => {
      const codes: Record<string, string> = {};
      for (const voucher of vouchers) {
        try {
          const qrDataUrl = await QRCode.toDataURL(voucher.code, {
            width: 200,
            margin: 1,
          });
          codes[voucher.id] = qrDataUrl;
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      setQrCodes(codes);
    };

    if (vouchers.length > 0) {
      generateAllQRCodes();
    }
  }, [vouchers]);

  if (vouchers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Gift className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nu ai vouchere în această categorie
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vouchers.map((voucher) => (
        <Card key={voucher.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-lg">
                {voucher.experiences?.title || 'Voucher Cadou'}
              </CardTitle>
              {getStatusBadge(voucher.status)}
            </div>
            <CardDescription>
              {voucher.experiences?.location_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* QR Code */}
              {qrCodes[voucher.id] && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodes[voucher.id]} 
                    alt="QR Code" 
                    className="w-32 h-32 border rounded-lg"
                  />
                </div>
              )}

              {/* Voucher Code */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Cod voucher</p>
                <p className="font-mono font-bold text-lg">{voucher.code}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  <span>Valoare: {voucher.purchase_price} RON</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Valabil până: {new Date(voucher.expiry_date).toLocaleDateString('ro-RO')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDownload(voucher)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                {voucher.status === 'active' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      window.location.hash = `/redeem-voucher?code=${voucher.code}`;
                    }}
                  >
                    Rezervă
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyVouchers;
