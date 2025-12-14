import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, ArrowRight, ArrowLeft, Gift, MapPin, Phone, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

interface GiftDetails {
  country: string;
  county: string;
  city: string;
  address: string;
  postcode: string;
  phone: string;
  instructions: string;
}

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, removeItem, updateQuantity, toggleGift, subtotal } = useCart();

  const [giftDetails, setGiftDetails] = useState<GiftDetails>({
    country: "România",
    county: "",
    city: "",
    address: "",
    postcode: "",
    phone: "",
    instructions: "",
  });

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast({
      title: t('cart.itemRemoved'),
      description: t('cart.itemRemovedDesc'),
    });
  };

  const hasGiftItems = items.some(item => item.isGift);
  const isEmpty = items.length === 0;
  const tax = subtotal * 0.19; // 19% VAT
  const total = subtotal + tax;

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
              onClick={() => navigate('/')}
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
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
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
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gift Toggle */}
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        <span className="font-medium">{t('cart.sendAsGift')}</span>
                      </div>
                      <Switch 
                        checked={item.isGift}
                        onCheckedChange={(checked) => toggleGift(item.id, checked)}
                      />
                    </div>
                  </Card>
                ))}

                {/* Gift Shipping Details */}
                {hasGiftItems && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Gift className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold">{t('cart.giftDeliveryDetails')}</h3>
                      </div>
                      
                      <div className="grid gap-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="country">{t('cart.country')}</Label>
                            <Input
                              id="country"
                              value={giftDetails.country}
                              onChange={(e) => setGiftDetails({...giftDetails, country: e.target.value})}
                              placeholder="România"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="county">{t('cart.county')}</Label>
                            <Input
                              id="county"
                              value={giftDetails.county}
                              onChange={(e) => setGiftDetails({...giftDetails, county: e.target.value})}
                              placeholder={t('cart.countyPlaceholder')}
                            />
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">{t('cart.city')}</Label>
                            <Input
                              id="city"
                              value={giftDetails.city}
                              onChange={(e) => setGiftDetails({...giftDetails, city: e.target.value})}
                              placeholder={t('cart.cityPlaceholder')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postcode">{t('cart.postcode')}</Label>
                            <Input
                              id="postcode"
                              value={giftDetails.postcode}
                              onChange={(e) => setGiftDetails({...giftDetails, postcode: e.target.value})}
                              placeholder="123456"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t('cart.address')}
                          </Label>
                          <Input
                            id="address"
                            value={giftDetails.address}
                            onChange={(e) => setGiftDetails({...giftDetails, address: e.target.value})}
                            placeholder={t('cart.addressPlaceholder')}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {t('cart.phone')}
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={giftDetails.phone}
                            onChange={(e) => setGiftDetails({...giftDetails, phone: e.target.value})}
                            placeholder="+40 7XX XXX XXX"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="instructions" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('cart.deliveryInstructions')}
                          </Label>
                          <Textarea
                            id="instructions"
                            value={giftDetails.instructions}
                            onChange={(e) => setGiftDetails({...giftDetails, instructions: e.target.value})}
                            placeholder={t('cart.instructionsPlaceholder')}
                            rows={3}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">{t('cart.orderSummary')}</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('cart.subtotal')}</span>
                      <span>{subtotal} {t('common.lei')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('cart.vat')}</span>
                      <span>{tax.toFixed(2)} {t('common.lei')}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>{t('cart.total')}</span>
                    <span>{total.toFixed(2)} {t('common.lei')}</span>
                  </div>

                  <Button className="w-full" size="lg" asChild>
                    <Link to="/auth">
                      {t('cart.checkout')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
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
