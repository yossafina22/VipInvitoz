'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from './Icon';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatProps {
  creditsLeft: number;
  isPremium?: boolean;
}

const INITIAL: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: "Votre invitation est prête. Dites-moi comment l'améliorer : « plus formel », « ajoute une citation », « change les couleurs pour plus de doré ».",
  },
];

export function AIChat({ creditsLeft, isPremium = false }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL);
  const [input, setInput] = useState('');

  const send = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed },
      {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        text: '(aperçu) Modification simulée. La vraie IA Claude 5.5 sera branchée dans la prochaine vague.',
      },
    ]);
    setInput('');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headings font-bold text-base text-foreground">Modifier via IA</h3>
        <span className="text-xs font-body font-bold text-gold bg-gold-light px-2 py-1 rounded-md">
          {creditsLeft === -1 ? '∞ crédits' : `${creditsLeft} crédits`}
        </span>
      </div>

      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm font-body leading-relaxed rounded-lg px-3 py-2 ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground self-end ml-6'
                : 'bg-secondary text-secondary-foreground self-start mr-6'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isPremium ? 'Discutez avec l’IA...' : 'Décrivez une modification...'}
          className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || creditsLeft === 0}
          className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-body font-bold disabled:opacity-50 flex items-center gap-1"
        >
          <Icon name="send" size={14} />
        </button>
      </form>

      {!isPremium && (
        <p className="text-xs text-muted-foreground">
          Passez en Premium pour un chatbot interactif + 12 crédits.
        </p>
      )}
    </div>
  );
}
