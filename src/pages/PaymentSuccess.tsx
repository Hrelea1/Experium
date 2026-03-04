import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !user || processedRef.current) return;

    processedRef.current = true;

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Verification failed");

        clearCart();
        setStatus("success");

        // Navigate to order confirmation with data
        setTimeout(() => {
          navigate("/order-confirmation", {
            state: { orderData: data },
            replace: true,
          });
        }, 1500);
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setErrorMsg(err.message || "A apărut o eroare la verificarea plății");
        setStatus("error");
      }
    };

    verifyPayment();
  }, [searchParams, user, navigate, clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-lg text-center">
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20"
            >
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Se verifică plata...</h1>
              <p className="text-muted-foreground">
                Te rugăm să aștepți, procesăm comanda ta.
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Plată confirmată!</h1>
              <p className="text-muted-foreground">
                Redirecționare către confirmarea comenzii...
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20"
            >
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Eroare la verificarea plății</h1>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/cart")}>
                  Înapoi la coș
                </Button>
                <Button onClick={() => navigate("/")}>Acasă</Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
