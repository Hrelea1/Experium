import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Bună! 👋 Sunt asistentul tău virtual. Te pot ajuta să găsești experiența perfectă pentru tine sau pentru cei dragi. Ce tip de experiență cauți?",
    isBot: true,
  },
];

const quickReplies = [
  "Caut un cadou romantic",
  "Vreau o aventură în natură",
  "Experiențe de relaxare",
  "Idei pentru grupuri",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: text.trim(),
      isBot: false,
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(text),
        isBot: true,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes("romantic") || lower.includes("cuplu")) {
      return "Pentru o experiență romantică, îți recomand: 💕\n\n• Cină romantică la lumina lumânărilor în Brașov\n• Zbor cu balonul pentru 2 în Transilvania\n• Weekend spa în Băile Felix\n\nDorești detalii despre vreuna?";
    }
    if (lower.includes("aventură") || lower.includes("natură") || lower.includes("adrenalină")) {
      return "Pentru iubitorii de aventură avem: 🏔️\n\n• Rafting pe Olt\n• Paragliding în Brașov\n• Safari cu ATV în Apuseni\n• Escaladă în Cheile Bicazului\n\nCare te atrage cel mai mult?";
    }
    if (lower.includes("relax") || lower.includes("spa") || lower.includes("wellness")) {
      return "Pentru relaxare totală: 🧘‍♀️\n\n• Retreat spa premium în Vatra Dornei\n• Masaj și tratamente în Sovata\n• Circuit termal în Băile Herculane\n\nAi o preferință pentru locație?";
    }
    if (lower.includes("grup") || lower.includes("echipă") || lower.includes("prieteni")) {
      return "Pentru grupuri avem experiențe speciale: 🎉\n\n• Escape room tematic\n• Wine tasting pentru grupuri\n• Paintball & team building\n• Ture ghidate în grup\n\nCâte persoane sunteți?";
    }
    
    return "Îmi poți spune mai multe despre ce cauți? De exemplu: pentru cine este cadoul, ce buget ai în minte, sau ce tip de activitate preferă persoana respectivă. 😊";
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ${isOpen ? "scale-0" : "scale-100"}`}
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          AI
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">Asistent AI</h3>
                  <p className="text-primary-foreground/80 text-sm">Online acum</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.isBot ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.isBot ? "bg-muted" : "bg-primary"
                    }`}
                  >
                    {message.isBot ? (
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <User className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.isBot
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Scrie un mesaj..."
                  className="flex-1 h-11 px-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button type="submit" size="icon" className="h-11 w-11 rounded-xl">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
