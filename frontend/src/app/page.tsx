import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { PricingCard } from '@/components/PricingCard';
import { WaxPattern } from '@/components/WaxPattern';
import { Image } from '@/components/Image';
import { UserAvatar } from '@/components/UserAvatar';
import { Icon } from '@/components/Icon';

export const runtime = 'nodejs';

const FREE_FEATURES = [
  { label: '1 cérémonie', included: true },
  { label: '20 invités max', included: true },
  { label: 'Génération IA (6 modifications)', included: true },
  { label: 'RSVP en temps réel', included: true },
  { label: 'QR code check-in', included: true },
  { label: 'Plan de table', included: false },
  { label: 'Projection live photos', included: false },
  { label: 'Suivi budget', included: false },
];

const PREMIUM_FEATURES = [
  { label: 'Invités illimités', included: true },
  { label: '12 modifications IA + chatbot', included: true },
  { label: 'Multi-cérémonie', included: true },
  { label: 'Plan de table drag & drop', included: true },
  { label: 'Projection live photos', included: true },
  { label: "Livre d'or enrichi", included: true },
  { label: 'Suivi budget', included: false },
  { label: 'Coordination prestataires', included: false },
];

const VIP_FEATURES = [
  { label: 'Tout Premium inclus', included: true },
  { label: 'IA modifications illimitées', included: true },
  { label: 'Suivi budget temps réel', included: true },
  { label: 'Coordination prestataires', included: true },
  { label: 'Orientation invités + navigation', included: true },
  { label: 'Priorité support', included: true },
  { label: 'Export souvenir', included: true },
  { label: 'Accès anticipé nouvelles features', included: true },
];

const CEREMONIES = [
  {
    emoji: '💍',
    label: 'Mariage',
    prompt: 'Mariage africain avec décorations dorées et kente',
    src: '/banani/ceremony-mariage.jpg',
  },
  {
    emoji: '🕊️',
    label: 'Baptême',
    prompt: 'Baptême africain avec fleurs blanches',
    src: '/banani/ceremony-bapteme.jpg',
  },
  {
    emoji: '🎂',
    label: 'Anniversaire',
    prompt: 'Anniversaire africain avec décor coloré',
    src: '/banani/ceremony-anniversaire.jpg',
  },
  {
    emoji: '🕯️',
    label: 'Deuil',
    prompt: 'Cérémonie commémorative avec bougies blanches et lys',
    src: '/banani/ceremony-deuil.jpg',
  },
  {
    emoji: '🥁',
    label: 'Coutumier',
    prompt: 'Cérémonie coutumière africaine avec tissu wax et tambours',
    src: '/banani/ceremony-coutumier.jpg',
  },
];

const FEATURES = [
  {
    icon: 'sparkles',
    title: 'IA en 1 phrase',
    desc: "Décrivez, l'IA génère l'invitation complète",
  },
  { icon: 'users', title: 'RSVP temps réel', desc: 'Comptez vos invités sans appeler chacun' },
  { icon: 'table-2', title: 'Plan de table', desc: 'Drag & drop, zéro confusion le jour J' },
  { icon: 'wallet', title: 'Budget intégré', desc: 'FCFA ou €, solde en temps réel' },
  { icon: 'projector', title: 'Projection live', desc: 'Photos des invités sur grand écran' },
  { icon: 'book-open', title: "Livre d'or", desc: 'Messages des invités — en souvenir' },
];

const STEPS = [
  {
    n: '01',
    title: 'Décrivez en 1 phrase',
    desc: "Dites-nous le type de cérémonie, la date et l'ambiance souhaitée. L'IA fait le reste en moins d'une minute.",
    icon: 'message-square',
  },
  {
    n: '02',
    title: 'Invitez & suivez',
    desc: 'Ajoutez vos invités, envoyez via WhatsApp, suivez les RSVP en direct depuis votre téléphone.',
    icon: 'users',
  },
  {
    n: '03',
    title: 'Vivez le jour J',
    desc: "QR code check-in à l'entrée, projection live de photos, livre d'or — tout se gère en un clic.",
    icon: 'sparkles',
  },
];

const TESTIMONIALS = [
  {
    name: 'Aïssatou D.',
    city: 'Dakar, Sénégal',
    quote:
      "« En 30 minutes j'avais une invitation magnifique et 200 personnes notifiées via WhatsApp. Même ma belle-mère a adoré ! »",
    ceremony: 'Mariage',
    index: 0,
  },
  {
    name: 'Raoul M.',
    city: 'Francfort, Allemagne',
    quote:
      "« Invités sur 2 continents, plan de table parfait, le livre d'or était le souvenir le plus émouvant de tout le baptême. »",
    ceremony: 'Baptême',
    index: 1,
  },
  {
    name: 'Fatou K.',
    city: "Abidjan, Côte d'Ivoire",
    quote:
      "« Même pour un programme de deuil, l'app était là. Simple, digne, sans complications. Merci. »",
    ceremony: 'Deuil',
    index: 2,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background font-body">
      <NavBar activePage="accueil" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
          <div className="px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 lg:py-8 xl:py-10 flex flex-col justify-center relative z-10">
            <WaxPattern opacity={0.04} />
            <div className="inline-flex items-center gap-2 bg-gold-light text-gold text-xs font-bold px-3 py-1.5 rounded-full mb-3 lg:mb-4 w-fit">
              <Icon name="sparkles" size={12} />
              L&apos;app africaine tout-en-un
            </div>
            <h1 className="font-headings font-bold text-3xl sm:text-4xl lg:text-4xl xl:text-5xl text-foreground leading-tight mb-3 lg:mb-4">
              Vos cérémonies, <br />
              <span className="text-primary">organisées avec cœur.</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-base xl:text-lg text-muted-foreground leading-relaxed mb-4 lg:mb-5 max-w-lg">
              De l&apos;invitation générée par IA au jour J — mariage, baptême, anniversaire ou
              deuil. VipInvitoz est fait pour les familles africaines, en Afrique et dans la
              diaspora.
            </p>
            <div className="mb-5 lg:mb-6 flex justify-center">
              <Link
                href="/auth/signup"
                className="bg-primary text-primary-foreground font-body font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg text-center shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                Commencer gratuitement
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 lg:gap-6">
              {[
                { val: '50 000+', label: 'Cérémonies organisées' },
                { val: '4.8/5', label: 'Note utilisateurs' },
                { val: '8 pays', label: 'Afrique & diaspora' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-headings font-bold text-lg lg:text-xl xl:text-2xl text-foreground">
                    {stat.val}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-[500px] xl:min-h-[560px]">
            <Image
              ar="4:3"
              src="/banani/hero.jpg"
              prompt="Couple africain élégant en cérémonie de mariage, décor terracotta et doré"
              objectPosition="center 15%"
              className="w-full h-full lg:absolute lg:inset-0"
              priority
            />
            <div className="hidden sm:block absolute top-6 right-6 bg-card border border-border rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                <Icon name="check-circle" size={12} />
                Invitation générée en 47 s
              </div>
            </div>
            <div className="hidden sm:block absolute bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs text-muted-foreground mb-1">RSVP en direct</div>
              <div className="font-headings font-bold text-xl lg:text-2xl text-foreground">
                87 <span className="text-sm text-muted-foreground font-body">/ 200</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-2 w-28 lg:w-36">
                <div className="bg-success h-full" style={{ width: '62%' }} />
                <div className="bg-danger h-full" style={{ width: '8%' }} />
                <div className="bg-muted h-full flex-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ceremony types */}
      <section className="py-8 lg:py-10 px-4 sm:px-8 lg:px-16 xl:px-20 bg-card">
        <div className="text-center mb-5 lg:mb-6">
          <div className="text-xs uppercase tracking-widest text-gold font-bold mb-2">
            Pour chaque moment
          </div>
          <h2 className="font-headings font-bold text-xl sm:text-2xl lg:text-3xl text-foreground">
            Chaque cérémonie mérite le meilleur
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:gap-5 lg:justify-center">
          {CEREMONIES.map((c) => (
            <Link
              key={c.label}
              href="/auth/signup"
              className="group flex flex-col items-center gap-2 lg:w-36 lg:shrink-0 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="w-full aspect-square lg:w-32 lg:h-32 rounded-xl overflow-hidden ring-1 ring-border group-hover:ring-2 group-hover:ring-primary shadow-sm group-hover:shadow-lg transition-all">
                <Image ar="1:1" src={c.src} prompt={c.prompt} className="w-full h-full" />
              </div>
              <div className="text-lg lg:text-xl group-hover:scale-110 transition-transform">
                {c.emoji}
              </div>
              <div className="font-body font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors text-center">
                {c.label}
              </div>
            </Link>
          ))}
          <Link
            href="/auth/signup"
            className="group flex flex-col items-center gap-2 lg:w-36 lg:shrink-0 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="relative w-full aspect-square lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gold-light via-secondary to-wax-orange/30 border-2 border-dashed border-gold flex flex-col items-center justify-center gap-1 shadow-sm group-hover:shadow-lg group-hover:border-primary transition-all">
              <Icon
                name="plus"
                size={28}
                className="text-primary group-hover:scale-110 transition-transform lg:!w-8 lg:!h-8"
                strokeWidth={2.5}
              />
              <span className="text-[10px] sm:text-xs font-body font-bold text-primary text-center px-1">
                15 autres
              </span>
            </div>
            <div className="font-body font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors text-center">
              Et bien plus
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
              Tout-en-un
            </div>
            <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground mb-5 lg:mb-6 leading-tight">
              Tout ce qu&apos;il vous faut pour une cérémonie réussie
            </h2>
            <p className="text-base text-muted-foreground mb-6 lg:mb-8 leading-relaxed">
              Des outils puissants pensés pour les réalités africaines — mobile money, grandes
              familles, connexion variable, cérémonies transnationales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group flex gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                >
                  <div className="w-9 h-9 bg-secondary group-hover:bg-primary rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <Icon
                      name={f.icon}
                      size={16}
                      className="text-primary group-hover:text-primary-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <div className="font-body font-bold text-sm text-foreground mb-0.5">
                      {f.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <Image
                ar="3:4"
                src="/banani/features.jpg"
                prompt="Femme africaine en robe en wax souriant devant son smartphone, organisation d'une cérémonie familiale"
                className="w-full"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-primary text-primary-foreground rounded-xl px-4 lg:px-5 py-3 text-sm font-body font-bold shadow-sm">
              <div className="text-xs opacity-80 mb-0.5">WhatsApp → Invité confirmé</div>
              <div className="flex items-center gap-1.5">
                <Icon name="check-circle" size={14} />
                87 RSVP reçus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="howto"
        className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20 bg-dark relative overflow-hidden"
      >
        <WaxPattern opacity={0.05} />
        <div className="text-center mb-10 lg:mb-14 relative z-10">
          <div className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
            Simple comme bonjour
          </div>
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-primary-foreground">
            Comment ça marche ?
          </h2>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-0 max-w-4xl mx-auto relative z-10">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-start flex-1 w-full">
              <div className="flex flex-col items-center text-center px-4 lg:px-8 w-full">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                  <Icon name={step.icon} size={24} className="text-primary-foreground" />
                </div>
                <div className="text-xs text-gold font-bold mb-2">{step.n}</div>
                <div className="font-headings font-bold text-lg text-primary-foreground mb-2">
                  {step.title}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">{step.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block mt-8 text-muted-foreground shrink-0">
                  <Icon name="arrow-right" size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20">
        <div className="text-center mb-10 lg:mb-14">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
            Tarifs
          </div>
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4">
            Des formules pour chaque besoin
          </h2>
          <p className="text-muted-foreground">
            Wave, Orange Money, carte bancaire — payez comme vous le souhaitez.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PricingCard
            name="Freemium"
            priceAfrica="0 FCFA"
            priceEurope="0 €"
            features={FREE_FEATURES}
            tier="freemium"
          />
          <PricingCard
            name="Premium"
            priceAfrica="8 000 FCFA"
            priceEurope="11,99 €"
            features={PREMIUM_FEATURES}
            tier="premium"
            highlight
          />
          <PricingCard
            name="VIP"
            priceAfrica="15 000 FCFA"
            priceEurope="21,99 €"
            features={VIP_FEATURES}
            tier="vip"
          />
        </div>
      </section>

      {/* Social proof */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20 bg-card">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground">
            Ils ont organisé avec VipInvitoz
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-background border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar name={t.name} index={t.index} className="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <div className="font-body font-bold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.city}</div>
                </div>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                  {t.ceremony}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">{t.quote}</p>
              <div className="flex gap-0.5 mt-3" aria-label="5 étoiles sur 5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-gold text-sm" aria-hidden>
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <Image
          ar="16:4"
          src="/banani/cta.jpg"
          prompt="Table de banquet de mariage africain décorée avec fleurs terracotta et bougies dorées"
          className="w-full"
        />
        <div className="absolute inset-0 bg-dark opacity-60" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-20">
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-5xl text-primary-foreground mb-4 max-w-3xl">
            Prêt(e) à organiser votre prochaine cérémonie ?
          </h2>
          <p className="text-primary-foreground opacity-80 mb-6 lg:mb-8 text-base lg:text-lg max-w-xl">
            Rejoignez des milliers de familles africaines qui font confiance à VipInvitoz.
          </p>
          <Link
            href="/auth/signup"
            className="bg-primary text-primary-foreground font-body font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base lg:text-lg"
          >
            Créer mon compte gratuitement →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
