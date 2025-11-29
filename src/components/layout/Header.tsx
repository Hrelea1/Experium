import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useTranslation } from "react-i18next";
import { SearchDialog } from "@/components/layout/SearchDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { t } = useTranslation();

  const handleNavClick = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLinks = [
    { label: t('nav.experiences'), id: "experiences" },
    { label: t('nav.regions'), id: "regions" },
    { label: t('nav.howItWorks'), id: "how-it-works" },
    { label: t('nav.contact'), id: "contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="container">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transition-shadow group-hover:shadow-lg group-hover:shadow-primary/25"
            >
              <span className="text-primary-foreground font-bold text-xl">E</span>
            </motion.div>
            <span className="hidden sm:block font-bold text-xl text-foreground">
              Experium
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {t('nav.admin')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex relative z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchOpen(true);
              }}
              aria-label="Search"
            >
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
                    {t('nav.login')}
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
                  {t('nav.login')}
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
                <button
                  key={link.id}
                  onClick={() => {
                    handleNavClick(link.id);
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
               {isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  {t('nav.admin')}
                </Link>
              )}
              <div className="flex items-center gap-4 px-4 pt-4 border-t border-border mt-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchOpen(true);
                    setIsMenuOpen(false);
                  }}
                  aria-label="Search"
                >
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
                      {t('nav.login')}
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
