import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  const dynamicFooterLinks = {
    experiențe: [
      { label: t('footer.adventure'), href: "/category/aventura" },
      { label: t('footer.wellness'), href: "/category/spa-relaxare" },
      { label: t('footer.gastronomy'), href: "/category/gastronomie" },
      { label: t('footer.culture'), href: "/category/arta-cultura" },
    ],
    regiuni: [
      { label: "Transilvania", href: "/category/toate-categoriile?region=transilvania" },
      { label: "Bucovina", href: "/category/toate-categoriile?region=bucovina" },
      { label: "Maramureș", href: "/category/toate-categoriile?region=maramures" },
      { label: "Dobrogea", href: "/category/toate-categoriile?region=dobrogea" },
      { label: "Banat", href: "/category/toate-categoriile?region=banat" },
    ],
    suport: [
      { label: t('footer.faq'), href: "/faq" },
      { label: t('footer.contact'), href: "/contact" },
      { label: t('footer.howItWorks'), href: "/#how-it-works" },
      { label: t('footer.termsConditions'), href: "/terms" },
    ],
    companie: [
      { label: t('footer.about'), href: "/about" },
      { label: t('footer.careers'), href: "/careers" },
      { label: t('footer.partners'), href: "/partners" },
      { label: t('footer.blog'), href: "/blog" },
    ],
  };

  return (
    <footer id="contact" className="bg-secondary text-secondary-foreground">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-1 mb-4">
              <span 
                className="font-bold text-2xl flex items-baseline"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="text-primary text-3xl font-extrabold">E</span>
                <span className="text-primary">xperium</span>
              </span>
            </Link>
            <p className="text-secondary-foreground/70 mb-6 max-w-xs">
              {t('footer.description')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href="tel:+40721234567" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                +40 721 234 567
              </a>
              <a href="mailto:contact@experium.ro" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                contact@experium.ro
              </a>
              <div className="flex items-center gap-2 text-secondary-foreground/70">
                <MapPin className="w-4 h-4" />
                Craiova, România
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                  aria-label={`Social link ${i + 1}`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.experiences')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.experiențe.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.regions')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.regiuni.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.suport.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.companie.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-foreground/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-foreground/60 text-sm">
            © 2025 Experium. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/cookies" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.cookies')}
            </Link>
            <Link to="/gdpr" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.gdpr')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}