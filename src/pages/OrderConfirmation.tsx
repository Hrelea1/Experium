import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Download, Gift, Calendar, MapPin, ArrowRight, Home, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  title: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  voucherCode: string;
}

interface OrderData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

// Generate a random voucher code
function generateVoucherCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EXP-${year}-${code}`;
}

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Get order data from navigation state
    if (location.state?.orderData) {
      const data = location.state.orderData;
      const items = data.vouchers?.map((v: any) => ({
        id: v.id,
        title: v.experienceTitle,
        location: '',
        price: v.price,
        quantity: 1,
        image: '/placeholder.svg',
        voucherCode: v.code,
      })) || [];
      
      const subtotal = items.reduce((sum: number, item: OrderItem) => sum + item.price, 0);
      
      setOrderData({
        orderId: data.orderId,
        items,
        subtotal,
        tax: 0, // TVA already included
        total: subtotal,
        createdAt: new Date().toISOString(),
      });
    } else if (location.state?.cartItems) {
      // Fallback for old flow (should not happen with new checkout)
      const items = location.state.cartItems.map((item: any) => ({
        ...item,
        voucherCode: generateVoucherCode(),
      }));
      
      const subtotal = items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);
      
      setOrderData({
        orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
        items,
        subtotal,
        tax: 0,
        total: subtotal,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Redirect to home if no order data
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t('orderConfirmation.codeCopied'),
      description: code,
    });
  };

  const handleDownloadVoucher = (item: OrderItem) => {
    // In production, this would generate a PDF
    toast({
      title: t('orderConfirmation.downloadStarted'),
      description: t('orderConfirmation.downloadDesc'),
    });
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t('orderConfirmation.title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {t('orderConfirmation.subtitle')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('orderConfirmation.orderId')}: <span className="font-mono font-semibold text-foreground">{orderData.orderId}</span>
            </p>
          </motion.div>

          {/* Order Items with Voucher Codes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mb-8"
          >
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              {t('orderConfirmation.yourVouchers')}
            </h2>
            
            {orderData.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full md:w-32 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </p>
                      
                      {/* Voucher Code */}
                      <div className="bg-primary/10 rounded-lg p-4 mb-4">
                        <p className="text-xs text-muted-foreground mb-1">{t('orderConfirmation.voucherCode')}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-bold text-primary">
                            {item.voucherCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyCode(item.voucherCode)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('orderConfirmation.validFor12Months')}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadVoucher(item)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('orderConfirmation.downloadPdf')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to="/redeem-voucher">
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('orderConfirmation.scheduleNow')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">{item.price} {t('common.lei')}</span>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Order Summary - No separate VAT display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">{t('orderConfirmation.orderSummary')}</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('cart.totalWithVat')}</span>
                  <span>{orderData.total.toFixed(2)} {t('common.lei')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  TVA inclus în preț
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-muted/50 rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4">{t('orderConfirmation.nextSteps')}</h3>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">1</span>
                <span>{t('orderConfirmation.step1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">2</span>
                <span>{t('orderConfirmation.step2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">3</span>
                <span>{t('orderConfirmation.step3')}</span>
              </li>
            </ol>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg">
              <Link to="/redeem-voucher">
                {t('orderConfirmation.useVoucherNow')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">
                <Home className="mr-2 w-5 h-5" />
                {t('orderConfirmation.backToHome')}
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
