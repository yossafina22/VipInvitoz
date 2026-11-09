import { Image } from './Image';

interface InvitationPreviewProps {
  emoji?: string;
  title: string;
  body: string;
  date: string;
  time: string;
  location: string;
  family?: string;
  coverSrc?: string;
  coverPrompt?: string;
}

export function InvitationPreview({
  emoji = '💍',
  title,
  body,
  date,
  time,
  location,
  family,
  coverSrc = '/banani/invitation-cover.jpg',
  coverPrompt = 'Invitation de cérémonie',
}: InvitationPreviewProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="relative h-56 md:h-64 bg-input overflow-hidden">
        <Image ar="16:9" src={coverSrc} prompt={coverPrompt} className="w-full h-full" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background opacity-40"
          aria-hidden
        />
      </div>
      <div className="px-6 py-7 text-center">
        <div className="text-4xl mb-3">{emoji}</div>
        <h2 className="font-headings font-bold text-xl text-foreground mb-2 leading-tight">
          {title}
        </h2>
        <p className="text-sm text-foreground opacity-80 mb-6 leading-relaxed">{body}</p>
        <div className="flex justify-center items-stretch gap-3 mb-6 text-center">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Date</div>
            <div className="font-body font-bold text-sm text-foreground">{date}</div>
          </div>
          <div className="w-px bg-border" aria-hidden />
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Heure</div>
            <div className="font-body font-bold text-sm text-foreground">{time}</div>
          </div>
          <div className="w-px bg-border" aria-hidden />
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Lieu</div>
            <div className="font-body font-bold text-sm text-foreground">{location}</div>
          </div>
        </div>
        {family && <div className="text-xs text-muted-foreground mb-5">{family}</div>}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="bg-success text-primary-foreground text-sm font-body font-bold px-6 py-2.5 rounded-lg w-full"
          >
            ✓ Je confirme ma présence
          </button>
          <button
            type="button"
            className="bg-muted text-muted-foreground text-sm font-body font-bold px-4 py-2.5 rounded-lg"
          >
            Je ne peux pas venir
          </button>
        </div>
      </div>
    </div>
  );
}
