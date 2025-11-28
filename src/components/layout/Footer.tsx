import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const footerLinks = {
  experiențe: [
    { label: "Aventură", href: "#" },
    { label: "Spa & Relaxare", href: "#" },
    { label: "Gastronomie", href: "#" },
    { label: "Artă & Cultură", href: "#" },
    { label: "Sport", href: "#" },
  ],
  regiuni: [
    { label: "Transilvania", href: "#" },
    { label: "Bucovina", href: "#" },
    { label: "Maramureș", href: "#" },
    { label: "Dobrogea", href: "#" },
    { label: "Banat", href: "#" },
  ],
  suport: [
    { label: "Întrebări Frecvente", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Cum Funcționează", href: "#" },
    { label: "Politica de Retur", href: "#" },
    { label: "Termeni și Condiții", href: "#" },
  ],
  companie: [
    { label: "Despre Noi", href: "#" },
    { label: "Cariere", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Parteneri", href: "#" },
    { label: "Presă", href: "#" },
  ],
};

export function Footer() {
  const { t } = useTranslation();

  const dynamicFooterLinks = {
    experiențe: [
      { label: t('footer.adventure'), href: "#" },
      { label: t('footer.wellness'), href: "#" },
      { label: t('footer.gastronomy'), href: "#" },
      { label: t('footer.culture'), href: "#" },
    ],
    regiuni: [
      { label: "Transilvania", href: "#" },
      { label: "Bucovina", href: "#" },
      { label: "Maramureș", href: "#" },
      { label: "Dobrogea", href: "#" },
      { label: "Banat", href: "#" },
    ],
    suport: [
      { label: t('footer.faq'), href: "#" },
      { label: t('footer.contact'), href: "#" },
      { label: t('footer.howItWorks'), href: "#" },
      { label: t('footer.termsConditions'), href: "#" },
    ],
    companie: [
      { label: t('footer.about'), href: "#" },
      { label: t('footer.careers'), href: "#" },
      { label: t('footer.blog'), href: "#" },
      { label: t('footer.partners'), href: "#" },
    ],
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">E</span>
              </div>
              <span className="font-bold text-xl">
                Experium
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
                  <a href={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.regions')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.regiuni.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.suport.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2">
              {dynamicFooterLinks.companie.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </a>
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
            <a href="#" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="#" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.cookies')}
            </a>
            <a href="#" className="text-secondary-foreground/60 hover:text-primary transition-colors">
              {t('footer.gdpr')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
