import { motion } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function Cart() {
  const { t } = useTranslation();
  
  // Mock cart items - in production this would come from state management
  const cartItems = [
    {
      id: 1,
      title: "Zbor cu Balonul în Transilvania",
      location: "Brașov, Transilvania",
      price: 899,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=200&h=200&fit=crop",
    },
  ];

  const isEmpty = cartItems.length === 0;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Coșul Meu</h1>
          </div>

          {isEmpty ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Coșul este gol</h2>
              <p className="text-muted-foreground mb-6">
                Adaugă experiențe în coș pentru a continua
              </p>
              <Button asChild size="lg">
                <Link to="/">
                  Descoperă Experiențe
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
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
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">{item.price} lei</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">Sumar Comandă</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{subtotal} lei</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>TVA (19%)</span>
                      <span>{tax.toFixed(2)} lei</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span>{total.toFixed(2)} lei</span>
                  </div>

                  <Button className="w-full" size="lg">
                    Finalizează Comanda
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    🔒 Plată securizată • Anulare gratuită cu 48h înainte
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
