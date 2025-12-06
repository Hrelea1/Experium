import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, ShoppingBag, User, LogOut, Shield, ChevronDown, Sparkles, Gift, Handshake } from "lucide-react";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categories = [
  { label: "Aventură", slug: "aventura", icon: "🏔️" },
  { label: "Spa & Relaxare", slug: "spa-relaxare", icon: "🧖" },
  { label: "Gastronomie", slug: "gastronomie", icon: "🍷" },
  { label: "Artă & Cultură", slug: "arta-cultura", icon: "🎭" },
  { label: "Sport", slug: "sport", icon: "⚽" },
  { label: "Natură", slug: "natura", icon: "🌲" },
  { label: "Romantic", slug: "romantic", icon: "💕" },
  { label: "Călătorii", slug: "calatorii", icon: "✈️" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
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

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="container">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo - Wordmark */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.span 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-bold text-2xl sm:text-3xl text-primary tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              experium
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Categories Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent text-muted-foreground hover:text-foreground font-medium">
                    {t('nav.categories')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px] md:w-[500px] md:grid-cols-2">
                      {categories.map((category) => (
                        <NavigationMenuLink key={category.slug} asChild>
                          <Link
                            to={`/category/${category.slug}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <span className="text-2xl">{category.icon}</span>
                            <span className="font-medium text-foreground">{category.label}</span>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Experiences Link */}
            <Link
              to="/category/toate-categoriile"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group flex items-center gap-1"
              aria-label="Vezi toate experiențele"
            >
              <Sparkles className="h-4 w-4" />
              {t('nav.experiences')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>

            {/* Gift Ideas Link */}
            <Link
              to="/gift-ideas"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group flex items-center gap-1"
            >
              <Gift className="h-4 w-4" />
              {t('nav.giftIdeas')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>

            <button
              onClick={() => handleNavClick("regions")}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group"
            >
              {t('nav.regions')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>

            <button
              onClick={() => handleNavClick("how-it-works")}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group"
            >
              {t('nav.howItWorks')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </button>

            {/* Partners Link */}
            <Link
              to="/partners"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 relative group flex items-center gap-1"
            >
              <Handshake className="h-4 w-4" />
              {t('nav.partners')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>

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
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex"
              asChild
            >
              <Link to="/my-bookings" aria-label="Rezervările mele">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex relative"
              asChild
            >
              <Link to="/cart" aria-label="Coș de cumpărături">
                <ShoppingBag className="h-5 w-5" />
              </Link>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden lg:flex rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || 'Utilizator'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
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
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profilul meu
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-vouchers">Voucherele mele</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings">Rezervările mele</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/redeem-voucher">Folosește voucher</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" className="hidden lg:flex" asChild>
                <Link to="/auth">
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
              aria-label={isMenuOpen ? "Închide meniu" : "Deschide meniu"}
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
              {/* Categories Accordion */}
              <button
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors text-left flex items-center justify-between"
              >
                <span>{t('nav.categories')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {mobileCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4"
                  >
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/category/${category.slug}`}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>{category.icon}</span>
                        {category.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Link
                to="/category/toate-categoriile"
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                {t('nav.experiences')}
              </Link>

              <Link
                to="/gift-ideas"
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Gift className="h-4 w-4" />
                {t('nav.giftIdeas')}
              </Link>

              <button
                onClick={() => {
                  handleNavClick("regions");
                  setIsMenuOpen(false);
                }}
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors text-left"
              >
                {t('nav.regions')}
              </button>

              <button
                onClick={() => {
                  handleNavClick("how-it-works");
                  setIsMenuOpen(false);
                }}
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors text-left"
              >
                {t('nav.howItWorks')}
              </button>

              <Link
                to="/partners"
                className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Handshake className="h-4 w-4" />
                {t('nav.partners')}
              </Link>

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

              {user && (
                <>
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Contul meu
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profilul meu
                  </Link>
                  <Link
                    to="/my-vouchers"
                    className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Voucherele mele
                  </Link>
                  <Link
                    to="/redeem-voucher"
                    className="px-4 py-3 text-foreground font-medium hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Gift className="h-4 w-4" />
                    Folosește voucher
                  </Link>
                </>
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
                <Button 
                  variant="ghost" 
                  size="icon"
                  asChild
                >
                  <Link to="/my-bookings" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  asChild
                >
                  <Link to="/cart" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingBag className="h-5 w-5" />
                  </Link>
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
                  <Button variant="default" size="sm" className="ml-auto" asChild>
                    <Link to="/auth">
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