import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  Gift, 
  MapPin, 
  Phone, 
  CreditCard,
  Package,
  Mail,
  User,
  Check,
  Building
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useCart, DeliveryType } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

type PaymentMethod = 'card' | 'transfer' | 'apple' | 'google';

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    totalWithVat, 
    clearCart,
    deliveryType,
    setDeliveryType,
    personalDetails,
    setPersonalDetails,
    deliveryAddress,
    setDeliveryAddress,
    checkoutStep,
    setCheckoutStep
  } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast({
      title: t('cart.itemRemoved'),
      description: t('cart.itemRemovedDesc'),
    });
  };

  const isEmpty = items.length === 0;

  const handleSelectDeliveryType = (type: DeliveryType) => {
    setDeliveryType(type);
    setCheckoutStep(1);
  };

  const handlePersonalDetailsSubmit = () => {
    if (!personalDetails.fullName || !personalDetails.email) {
      toast({
        title: "Date incomplete",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }
    
    if (deliveryType === 'digital') {
      // Skip to payment for digital
      setCheckoutStep(3);
    } else {
      // Go to address for physical
      setCheckoutStep(2);
    }
  };

  const handleAddressSubmit = () => {
    if (!deliveryAddress.county || !deliveryAddress.city || !deliveryAddress.address) {
      toast({
        title: "Adresă incompletă",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }
    setCheckoutStep(3);
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: t('cart.loginRequired'),
        description: t('cart.loginRequiredDesc'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      navigate("/order-confirmation", {
        state: {
          cartItems: items,
          deliveryType,
          personalDetails,
          deliveryAddress: deliveryType === 'physical' ? deliveryAddress : null,
        },
      });
      
      clearCart();
      setIsProcessing(false);
    }, 1500);
  };

  const getStepTitle = () => {
    switch (checkoutStep) {
      case 0: return t('cart.chooseDeliveryType');
      case 1: return t('cart.personalDetails');
      case 2: return t('cart.deliveryAddress');
      case 3: return t('cart.paymentMethod');
      default: return t('cart.title');
    }
  };

  const renderDeliveryTypeSelection = () => (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        {t('cart.chooseDeliveryType')}
      </h3>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectDeliveryType('physical')}
          className="p-6 rounded-xl border-2 border-border hover:border-primary transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-semibold text-lg mb-2">{t('cart.physicalBox')}</h4>
          <p className="text-sm text-muted-foreground">{t('cart.physicalBoxDesc')}</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectDeliveryType('digital')}
          className="p-6 rounded-xl border-2 border-border hover:border-primary transition-colors text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-semibold text-lg mb-2">{t('cart.digitalBox')}</h4>
          <p className="text-sm text-muted-foreground">{t('cart.digitalBoxDesc')}</p>
        </motion.button>
      </div>
    </Card>
  );

  const renderPersonalDetails = () => (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        {t('cart.personalDetails')}
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('cart.fullName')} *</Label>
          <Input
            id="fullName"
            value={personalDetails.fullName}
            onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })}
            placeholder={t('cart.fullNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('cart.email')} *</Label>
          <Input
            id="email"
            type="email"
            value={personalDetails.email}
            onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
            placeholder={t('cart.emailPlaceholder')}
          />
        </div>

        {deliveryType === 'physical' && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('cart.phone')}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={personalDetails.phone}
              onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
              placeholder="+40 7XX XXX XXX"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={() => setCheckoutStep(0)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('cart.backToCart')}
        </Button>
        <Button onClick={handlePersonalDetailsSubmit} className="flex-1">
          {deliveryType === 'digital' ? t('cart.continueToPayment') : t('cart.continueToAddress')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderDeliveryAddress = () => (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        {t('cart.deliveryAddress')}
      </h3>
      
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">{t('cart.country')}</Label>
            <Input
              id="country"
              value={deliveryAddress.country}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, country: e.target.value })}
              placeholder="România"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="county">{t('cart.county')} *</Label>
            <Input
              id="county"
              value={deliveryAddress.county}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, county: e.target.value })}
              placeholder={t('cart.countyPlaceholder')}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{t('cart.city')} *</Label>
            <Input
              id="city"
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
              placeholder={t('cart.cityPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">{t('cart.postcode')}</Label>
            <Input
              id="postcode"
              value={deliveryAddress.postcode}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postcode: e.target.value })}
              placeholder="123456"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('cart.address')} *
          </Label>
          <Input
            id="address"
            value={deliveryAddress.address}
            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
            placeholder={t('cart.addressPlaceholder')}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={() => setCheckoutStep(1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('cart.backToDetails')}
        </Button>
        <Button onClick={handleAddressSubmit} className="flex-1">
          {t('cart.continueToPayment')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderPaymentMethod = () => (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        {t('cart.selectPaymentMethod')}
      </h3>
      
      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
        <div className="space-y-3">
          <Label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="card" />
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">{t('cart.creditCard')}</span>
          </Label>
          
          <Label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="transfer" />
            <Building className="h-5 w-5" />
            <span className="font-medium">{t('cart.bankTransfer')}</span>
          </Label>
          
          <Label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="apple" />
            <span className="font-semibold">🍎</span>
            <span className="font-medium">{t('cart.applePay')}</span>
          </Label>
          
          <Label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="google" />
            <span className="font-semibold">G</span>
            <span className="font-medium">{t('cart.googlePay')}</span>
          </Label>
        </div>
      </RadioGroup>

      <div className="flex gap-4 mt-6">
        <Button 
          variant="outline" 
          onClick={() => setCheckoutStep(deliveryType === 'digital' ? 1 : 2)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {deliveryType === 'digital' ? t('cart.backToDetails') : t('cart.backToAddress')}
        </Button>
        <Button 
          onClick={handleCheckout} 
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-2"
              />
              {t('cart.processing')}
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              {t('cart.checkout')}
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  const renderCheckoutProgress = () => {
    const steps = deliveryType === 'digital' 
      ? ['Tip livrare', 'Date personale', 'Plată']
      : ['Tip livrare', 'Date personale', 'Adresă', 'Plată'];
    
    const currentStep = deliveryType === 'digital' && checkoutStep === 3 ? 2 : checkoutStep;
    const totalSteps = steps.length;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < totalSteps - 1 && (
                <div className={`w-full h-1 mx-2 rounded ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} style={{ minWidth: '40px' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((step, index) => (
            <span key={step} className={index <= currentStep ? 'text-primary font-medium' : ''}>
              {step}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => checkoutStep > 0 ? setCheckoutStep(0) : navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">{t('cart.title')}</h1>
            </div>
          </div>

          {isEmpty ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">{t('cart.empty')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('cart.emptyDesc')}
              </p>
              <Button asChild size="lg">
                <Link to="/">
                  {t('cart.discoverExperiences')}
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items & Checkout Flow */}
              <div className="lg:col-span-2 space-y-4">
                {/* Cart Items - always visible */}
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={checkoutStep > 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={checkoutStep > 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">{item.price} {t('common.lei')}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={checkoutStep > 0}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Checkout Flow */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={checkoutStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {checkoutStep > 0 && renderCheckoutProgress()}
                    
                    {checkoutStep === 0 && renderDeliveryTypeSelection()}
                    {checkoutStep === 1 && renderPersonalDetails()}
                    {checkoutStep === 2 && renderDeliveryAddress()}
                    {checkoutStep === 3 && renderPaymentMethod()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">{t('cart.orderSummary')}</h2>
                  
                  {/* Delivery type badge */}
                  {deliveryType && (
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
                      {deliveryType === 'physical' ? (
                        <Gift className="h-5 w-5 text-primary" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary" />
                      )}
                      <span className="text-sm font-medium">
                        {deliveryType === 'physical' ? t('cart.physicalBox') : t('cart.digitalBox')}
                      </span>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>{t('cart.totalWithVat')}</span>
                    <span>{totalWithVat.toFixed(2)} {t('common.lei')}</span>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    🔒 {t('cart.securePayment')}
                  </p>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}