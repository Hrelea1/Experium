import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, ShoppingBag, User, LogOut, Shield } from "lucide-react";
import experiumLogo from "@/assets/experium-logo.svg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Experiențe", href: "#experiences" },
  { label: "Categorii", href: "#categories" },
  { label: "Regiuni", href: "#regions" },
  { label: "Cadouri", href: "#gifts" },
  { label: "Despre Noi", href: "#about" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="container">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.img
              src={experiumLogo}
              alt="Experium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-[30%] h-auto transition-all"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden lg:flex">
                    <User className="h-4 w-4 mr-2" />
                    Contul Meu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-vouchers">Voucherele Mele</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/redeem-voucher">Folosește Voucher</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="hidden lg:flex" asChild>
                <Link to="/auth">
                  <User className="h-4 w-4 mr-2" />
                  Autentificare
                </Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <nav className="container py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Link>
              )}
              <div className="flex items-center gap-4 px-4 pt-4 border-t border-border mt-2">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                </Button>
                {user ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Deconectare
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link to="/auth">
                      <User className="h-4 w-4 mr-2" />
                      Autentificare
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
