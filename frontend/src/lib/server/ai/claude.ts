// Claude AI service — invitation generation + modification + chatbot.
//
// Model: Claude Sonnet 5.5 by default (user decision — prioritise French
// writing quality + cultural tone). Override per call type via env to
// fall back on Haiku if cost becomes an issue.
//
// Cost tracking: every call returns `costMicrocents` (1 µcent = 10⁻⁶ cents)
// so we can aggregate precisely per user / month in the AiGeneration table.
// Pricing is a runtime table — easy to update when model prices change.

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

type AiKind = 'INITIAL' | 'MODIFICATION' | 'CHATBOT';

export type SupportedLocale = 'fr' | 'en' | 'de';
export type CeremonyType = 'MARIAGE' | 'BAPTEME' | 'ANNIVERSAIRE' | 'DEUIL' | 'AUTRE';

export interface CeremonyOccasionInput {
  label: string;
  startsAt: Date;
  locationName: string;
  locationAddress: string;
}

export interface InvitationBlock {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'cta';
  text: string;
}

export interface InvitationJson {
  palette: 'wax' | 'gold' | 'ivory' | 'indigo';
  blocks: InvitationBlock[];
}

export interface AiCallResult {
  invitation: InvitationJson;
  inputTokens: number;
  outputTokens: number;
  costMicrocents: number;
  model: string;
}

// ─── Pricing ───────────────────────────────────────────────────────────
// Microcents per token. 1 µcent = 10⁻⁶ cent = 10⁻⁸ USD.
// Update when provider prices change (they do, 1-2x/year).
const PRICING: Record<string, { input: number; output: number }> = {
  // $3 / MTok input, $15 / MTok output.
  'claude-sonnet-5-5': { input: 300, output: 1500 },
  // $0.80 / MTok input, $4 / MTok output.
  'claude-haiku-5-5': { input: 80, output: 400 },
  // Fallback — treated as Sonnet 5.5 pricing.
  default: { input: 300, output: 1500 },
};

function costMicrocents(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? PRICING.default!;
  return inputTokens * p.input + outputTokens * p.output;
}

const MODELS: Record<AiKind, string> = {
  INITIAL: process.env.AI_MODEL_INITIAL ?? 'claude-sonnet-5-5',
  MODIFICATION: process.env.AI_MODEL_MODIFICATION ?? 'claude-sonnet-5-5',
  CHATBOT: process.env.AI_MODEL_CHATBOT ?? 'claude-sonnet-5-5',
};

// ─── Client ────────────────────────────────────────────────────────────
let client: Anthropic | null = null;

export class ClaudeUnconfiguredError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY env var is required for Claude AI calls.');
    this.name = 'ClaudeUnconfiguredError';
  }
}

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ClaudeUnconfiguredError();
  client = new Anthropic({ apiKey });
  return client;
}

// ─── Prompts ───────────────────────────────────────────────────────────
const TYPE_TONE: Record<CeremonyType, string> = {
  MARIAGE: 'joyeux, élégant, chaleureux, teinté de tradition ouest-africaine',
  BAPTEME: 'doux, protecteur, spirituel, familial',
  ANNIVERSAIRE: 'festif, personnel, lumineux',
  DEUIL: 'respectueux, digne, sobre, apaisant — jamais joyeux ni triste à l’excès',
  AUTRE: 'équilibré, chaleureux, approprié au contexte familial africain',
};

const LOCALE_INSTRUCTION: Record<SupportedLocale, string> = {
  fr: 'Rédige strictement en français.',
  en: 'Write strictly in English.',
  de: 'Schreibe ausschließlich auf Deutsch.',
};

function systemPrompt(ceremonyType: CeremonyType, locale: SupportedLocale): string {
  return [
    `Tu rédiges des invitations pour la plateforme VipInvitoz, destinée aux familles africaines.`,
    `Type de cérémonie : ${ceremonyType}. Ton attendu : ${TYPE_TONE[ceremonyType]}.`,
    `${LOCALE_INSTRUCTION[locale]}`,
    `Les invitations respectent la culture ouest-africaine : grandes familles, importance des aînés, références à Dieu/Allah uniquement si l'utilisateur l'évoque dans sa description, usage du prénom + nom.`,
    `Tu ne dois PAS ajouter d'emojis décoratifs ni d'astérisques.`,
    `Tu réponds TOUJOURS par un seul objet JSON valide — rien d'autre, pas de markdown, pas de prose autour.`,
    `Structure JSON exigée :`,
    `  { "palette": "wax" | "gold" | "ivory" | "indigo",`,
    `    "blocks": [ { "id": "b1", "type": "title" | "subtitle" | "paragraph" | "quote" | "cta", "text": "..." } ] }`,
    `Entre 5 et 9 blocs. Palette choisie en fonction du type de cérémonie.`,
  ].join('\n');
}

function userPromptInitial(
  ceremonyType: CeremonyType,
  title: string,
  description: string,
  occasions: CeremonyOccasionInput[],
): string {
  const occLines = occasions
    .map(
      (o) => `- ${o.label} : ${o.startsAt.toISOString()} — ${o.locationName}, ${o.locationAddress}`,
    )
    .join('\n');
  return [
    `Titre : ${title}`,
    `Description libre de l'utilisateur :`,
    description,
    ``,
    `Dates et lieux :`,
    occLines,
    ``,
    `Génère l'invitation complète.`,
  ].join('\n');
}

function userPromptModification(
  currentInvitation: InvitationJson,
  modificationRequest: string,
): string {
  return [
    `Voici l'invitation actuelle (JSON) :`,
    JSON.stringify(currentInvitation),
    ``,
    `Modification demandée par l'utilisateur :`,
    modificationRequest,
    ``,
    `Renvoie la nouvelle invitation JSON complète avec la modification appliquée.`,
  ].join('\n');
}

// ─── Core call ─────────────────────────────────────────────────────────
async function call(
  kind: AiKind,
  ceremonyType: CeremonyType,
  locale: SupportedLocale,
  userMessage: string,
): Promise<AiCallResult> {
  const model = MODELS[kind];
  const c = getClient();
  const res = await c.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt(ceremonyType, locale),
    messages: [{ role: 'user', content: userMessage }],
  });

  const firstText = res.content.find((b) => b.type === 'text');
  if (!firstText || firstText.type !== 'text') {
    throw new Error('Claude returned no text content.');
  }
  const raw = firstText.text.trim();
  // Guard against accidental markdown fences even though we told it not to.
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');

  let invitation: InvitationJson;
  try {
    invitation = JSON.parse(stripped) as InvitationJson;
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${(e as Error).message}`);
  }
  if (!invitation || !Array.isArray(invitation.blocks)) {
    throw new Error('Claude JSON missing blocks[]');
  }

  const inputTokens = res.usage.input_tokens;
  const outputTokens = res.usage.output_tokens;
  return {
    invitation,
    inputTokens,
    outputTokens,
    costMicrocents: costMicrocents(model, inputTokens, outputTokens),
    model,
  };
}

// ─── Public API ────────────────────────────────────────────────────────

export function generateInitialInvitation(input: {
  ceremonyType: CeremonyType;
  locale: SupportedLocale;
  title: string;
  description: string;
  occasions: CeremonyOccasionInput[];
}): Promise<AiCallResult> {
  return call(
    'INITIAL',
    input.ceremonyType,
    input.locale,
    userPromptInitial(input.ceremonyType, input.title, input.description, input.occasions),
  );
}

export function modifyInvitation(input: {
  ceremonyType: CeremonyType;
  locale: SupportedLocale;
  current: InvitationJson;
  modificationRequest: string;
}): Promise<AiCallResult> {
  return call(
    'MODIFICATION',
    input.ceremonyType,
    input.locale,
    userPromptModification(input.current, input.modificationRequest),
  );
}

// Chatbot turn — kept minimal. Future: accept full conversation history.
export function chatbotTurn(input: {
  ceremonyType: CeremonyType;
  locale: SupportedLocale;
  current: InvitationJson;
  userMessage: string;
}): Promise<AiCallResult> {
  return call(
    'CHATBOT',
    input.ceremonyType,
    input.locale,
    userPromptModification(input.current, input.userMessage),
  );
}
