import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { PricingCard } from '@/components/PricingCard';
import { WaxPattern } from '@/components/WaxPattern';
import { Image } from '@/components/Image';
import { UserAvatar } from '@/components/UserAvatar';
import { Icon } from '@/components/Icon';

export const runtime = 'nodejs';

const CEREMONY_KEYS = ['mariage', 'bapteme', 'anniversaire', 'deuil', 'coutumier'] as const;
const CEREMONY_EMOJIS: Record<(typeof CEREMONY_KEYS)[number], string> = {
  mariage: '💍',
  bapteme: '🕊️',
  anniversaire: '🎂',
  deuil: '🕯️',
  coutumier: '🥁',
};
const CEREMONY_SRC: Record<(typeof CEREMONY_KEYS)[number], string> = {
  mariage: '/banani/ceremony-mariage.jpg',
  bapteme: '/banani/ceremony-bapteme.jpg',
  anniversaire: '/banani/ceremony-anniversaire.jpg',
  deuil: '/banani/ceremony-deuil.jpg',
  coutumier: '/banani/ceremony-coutumier.jpg',
};

const FEATURE_KEYS = ['ai', 'rsvp', 'seating', 'budget', 'projection', 'guestbook'] as const;
const FEATURE_ICONS: Record<(typeof FEATURE_KEYS)[number], string> = {
  ai: 'sparkles',
  rsvp: 'users',
  seating: 'table-2',
  budget: 'wallet',
  projection: 'projector',
  guestbook: 'book-open',
};

const STEP_KEYS = ['describe', 'invite', 'live'] as const;
const STEP_ICONS: Record<(typeof STEP_KEYS)[number], string> = {
  describe: 'message-square',
  invite: 'users',
  live: 'sparkles',
};

const TESTIMONIAL_KEYS = ['aissatou', 'raoul', 'fatou'] as const;

const FREE_KEYS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'] as const;
const FREE_INCLUDED: Record<(typeof FREE_KEYS)[number], boolean> = {
  f1: true,
  f2: true,
  f3: true,
  f4: true,
  f5: true,
  f6: false,
  f7: false,
  f8: false,
};
const PREMIUM_INCLUDED: Record<(typeof FREE_KEYS)[number], boolean> = {
  f1: true,
  f2: true,
  f3: true,
  f4: true,
  f5: true,
  f6: true,
  f7: false,
  f8: false,
};
const VIP_INCLUDED: Record<(typeof FREE_KEYS)[number], boolean> = {
  f1: true,
  f2: true,
  f3: true,
  f4: true,
  f5: true,
  f6: true,
  f7: true,
  f8: true,
};

export default async function LandingPage() {
  const t = await getTranslations('landing');

  const ceremonies = CEREMONY_KEYS.map((k) => ({
    key: k,
    emoji: CEREMONY_EMOJIS[k],
    label: t(`ceremonies.types.${k}`),
    prompt: t(`ceremonies.prompts.${k}`),
    src: CEREMONY_SRC[k],
  }));

  const features = FEATURE_KEYS.map((k) => ({
    key: k,
    icon: FEATURE_ICONS[k],
    title: t(`features.items.${k}.title`),
    desc: t(`features.items.${k}.desc`),
  }));

  const steps = STEP_KEYS.map((k, i) => ({
    key: k,
    n: String(i + 1).padStart(2, '0'),
    icon: STEP_ICONS[k],
    title: t(`steps.items.${k}.title`),
    desc: t(`steps.items.${k}.desc`),
  }));

  const testimonials = TESTIMONIAL_KEYS.map((k, i) => ({
    key: k,
    name: t(`testimonials.items.${k}.name`),
    city: t(`testimonials.items.${k}.city`),
    quote: t(`testimonials.items.${k}.quote`),
    ceremony: t(`testimonials.items.${k}.ceremony`),
    index: i,
  }));

  const freeFeatures = FREE_KEYS.map((k) => ({
    label: t(`pricing.free.${k}`),
    included: FREE_INCLUDED[k],
  }));
  const premiumFeatures = FREE_KEYS.map((k) => ({
    label: t(`pricing.premium.${k}`),
    included: PREMIUM_INCLUDED[k],
  }));
  const vipFeatures = FREE_KEYS.map((k) => ({
    label: t(`pricing.vip.${k}`),
    included: VIP_INCLUDED[k],
  }));

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
              {t('hero.tag')}
            </div>
            <h1 className="font-headings font-bold text-3xl sm:text-4xl lg:text-4xl xl:text-5xl text-foreground leading-tight mb-3 lg:mb-4">
              {t('hero.titleBefore')} <br />
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-base xl:text-lg text-muted-foreground leading-relaxed mb-4 lg:mb-5 max-w-lg">
              {t('hero.subtitle')}
            </p>
            <div className="mb-5 lg:mb-6 flex justify-center">
              <Link
                href="/auth/signup"
                className="bg-primary text-primary-foreground font-body font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg text-center shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                {t('hero.cta')}
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 lg:gap-6">
              <div>
                <div className="font-headings font-bold text-lg lg:text-xl xl:text-2xl text-foreground">
                  50 000+
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('hero.stats.ceremoniesLabel')}
                </div>
              </div>
              <div>
                <div className="font-headings font-bold text-lg lg:text-xl xl:text-2xl text-foreground">
                  4.8/5
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('hero.stats.ratingLabel')}
                </div>
              </div>
              <div>
                <div className="font-headings font-bold text-lg lg:text-xl xl:text-2xl text-foreground">
                  {t('hero.stats.countriesValue')}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('hero.stats.countriesLabel')}
                </div>
              </div>
            </div>
          </div>
          <div className="relative min-h-[260px] sm:min-h-[320px] lg:min-h-[500px] xl:min-h-[560px]">
            <Image
              ar="4:3"
              src="/banani/hero.jpg"
              prompt={t('hero.heroImagePrompt')}
              objectPosition="center 15%"
              className="w-full h-full lg:absolute lg:inset-0"
              priority
            />
            <div className="hidden sm:block absolute top-6 right-6 bg-card border border-border rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                <Icon name="check-circle" size={12} />
                {t('hero.badgeGenerated')}
              </div>
            </div>
            <div className="hidden sm:block absolute bottom-6 right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-xs text-muted-foreground mb-1">{t('hero.badgeRsvpTitle')}</div>
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
            {t('ceremonies.eyebrow')}
          </div>
          <h2 className="font-headings font-bold text-xl sm:text-2xl lg:text-3xl text-foreground">
            {t('ceremonies.title')}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:gap-5 lg:justify-center">
          {ceremonies.map((c) => (
            <Link
              key={c.key}
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
                {t('ceremonies.moreCount')}
              </span>
            </div>
            <div className="font-body font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors text-center">
              {t('ceremonies.moreLabel')}
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
              {t('features.eyebrow')}
            </div>
            <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground mb-5 lg:mb-6 leading-tight">
              {t('features.title')}
            </h2>
            <p className="text-base text-muted-foreground mb-6 lg:mb-8 leading-relaxed">
              {t('features.subtitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.key}
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
                prompt={t('features.imagePrompt')}
                className="w-full"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-primary text-primary-foreground rounded-xl px-4 lg:px-5 py-3 text-sm font-body font-bold shadow-sm">
              <div className="text-xs opacity-80 mb-0.5">{t('features.badgeWhatsapp')}</div>
              <div className="flex items-center gap-1.5">
                <Icon name="check-circle" size={14} />
                {t('features.badgeRsvp')}
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
            {t('steps.eyebrow')}
          </div>
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-primary-foreground">
            {t('steps.title')}
          </h2>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-0 max-w-4xl mx-auto relative z-10">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-start flex-1 w-full">
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
              {i < steps.length - 1 && (
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
            {t('pricing.eyebrow')}
          </div>
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PricingCard
            name={t('pricing.free.name')}
            priceAfrica="0 FCFA"
            priceEurope="0 €"
            features={freeFeatures}
            tier="freemium"
          />
          <PricingCard
            name={t('pricing.premium.name')}
            priceAfrica="8 000 FCFA"
            priceEurope="11,99 €"
            features={premiumFeatures}
            tier="premium"
            highlight
          />
          <PricingCard
            name={t('pricing.vip.name')}
            priceAfrica="15 000 FCFA"
            priceEurope="21,99 €"
            features={vipFeatures}
            tier="vip"
          />
        </div>
      </section>

      {/* Social proof */}
      <section className="py-14 lg:py-20 px-4 sm:px-8 lg:px-20 bg-card">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground">
            {t('testimonials.title')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((tst) => (
            <div
              key={tst.key}
              className="bg-background border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar name={tst.name} index={tst.index} className="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <div className="font-body font-bold text-sm text-foreground">{tst.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{tst.city}</div>
                </div>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                  {tst.ceremony}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">{tst.quote}</p>
              <div className="flex gap-0.5 mt-3" aria-label={t('testimonials.starsLabel')}>
                {[0, 1, 2, 3, 4].map((i) => (
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
          prompt={t('finalCta.imagePrompt')}
          className="w-full"
        />
        <div className="absolute inset-0 bg-dark opacity-60" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-20">
          <h2 className="font-headings font-bold text-2xl sm:text-3xl lg:text-5xl text-primary-foreground mb-4 max-w-3xl">
            {t('finalCta.title')}
          </h2>
          <p className="text-primary-foreground opacity-80 mb-6 lg:mb-8 text-base lg:text-lg max-w-xl">
            {t('finalCta.subtitle')}
          </p>
          <Link
            href="/auth/signup"
            className="bg-primary text-primary-foreground font-body font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base lg:text-lg"
          >
            {t('finalCta.button')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
