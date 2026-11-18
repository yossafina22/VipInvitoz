import { Image } from '@/components/Image';
import { Icon } from '@/components/Icon';

export const runtime = 'nodejs';

const PHOTOS = [
  {
    author: 'Awa Camara',
    caption: 'La mariée est magnifique !',
    keywords: 'african,wedding,bride',
  },
  { author: 'Kofi Mensah', caption: "Les enfants s'amusent bien", keywords: 'african,party,kids' },
  { author: 'Aïssatou Diop', caption: '', keywords: 'african,wedding,dance' },
  {
    author: 'Raoul Mendy',
    caption: 'Depuis Francfort avec amour',
    keywords: 'african,wedding,family',
  },
];

export default function LiveDisplayPage() {
  const current = PHOTOS[0]!;
  const upcoming = PHOTOS.slice(1);

  return (
    <div className="min-h-screen bg-dark text-primary-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="px-8 lg:px-12 py-5 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-headings font-bold text-lg">V</span>
          </div>
          <div>
            <h1 className="font-headings font-bold text-lg lg:text-xl">
              Mariage Aïssatou & Moussa
            </h1>
            <p className="text-xs opacity-70">25 novembre 2026 — Dakar</p>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2 bg-success/20 border border-success/40 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden />
            <span className="text-xs font-body font-bold text-success">EN DIRECT</span>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs opacity-70">Scannez pour envoyer</div>
            <div className="font-headings font-bold text-sm">vipin.vz/ceremony/abc123</div>
          </div>
        </div>
      </header>

      {/* Main photo */}
      <main className="flex-1 flex items-center justify-center px-8 lg:px-16 py-8 lg:py-10 relative">
        <div className="relative max-w-5xl w-full">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/20">
            <Image
              ar="16:9"
              keywords={current.keywords}
              prompt={current.author}
              className="w-full"
            />
          </div>
          {/* Caption overlay */}
          <div className="absolute inset-x-6 bottom-6 lg:inset-x-10 lg:bottom-10 bg-dark/80 backdrop-blur-sm rounded-xl px-5 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-headings font-bold text-sm lg:text-base">
                  {current.author.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-body font-bold text-base lg:text-lg">{current.author}</div>
                <div className="text-xs opacity-70">à l&apos;instant</div>
              </div>
            </div>
            {current.caption && (
              <p className="font-headings italic text-lg lg:text-2xl leading-tight">
                « {current.caption} »
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom thumbnails + QR */}
      <footer className="px-8 lg:px-12 py-5 border-t border-border/20 flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="w-20 h-20 bg-primary-foreground rounded-lg flex items-center justify-center">
            <Icon name="qr-code" size={64} className="text-dark" />
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Participez</div>
            <div className="font-headings font-bold text-sm">Scannez le QR</div>
            <div className="text-xs opacity-70">pour envoyer vos photos</div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="text-xs opacity-70 mb-2">À venir</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcoming.map((p, i) => (
              <div key={i} className="shrink-0 w-32 lg:w-40">
                <div className="rounded-lg overflow-hidden border border-border/20 mb-1">
                  <Image ar="1:1" keywords={p.keywords} prompt={p.author} className="w-full" />
                </div>
                <div className="text-xs font-body font-bold truncate">{p.author}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs opacity-70">Photos reçues</div>
          <div className="font-headings font-bold text-3xl lg:text-4xl text-gold">47</div>
        </div>
      </footer>
    </div>
  );
}
