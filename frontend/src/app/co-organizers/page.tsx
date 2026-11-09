'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { AlertBanner } from '@/components/AlertBanner';
import { UserAvatar } from '@/components/UserAvatar';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

type RoleId = 'coorg' | 'moderateur' | 'checkin';

interface Role {
  id: RoleId;
  title: string;
  desc: string;
  icon: string;
  color: string;
  badge: string;
  badgeColor: string;
}

const ROLES: Role[] = [
  {
    id: 'coorg',
    title: 'Co-organisateur',
    desc: 'Accès complet : invités, RSVP, plan de table, budget. Peut modifier et envoyer des invitations.',
    icon: 'user-check',
    color: 'bg-secondary text-secondary-foreground',
    badge: 'Plein accès',
    badgeColor: 'bg-primary text-primary-foreground',
  },
  {
    id: 'moderateur',
    title: 'Modérateur photo',
    desc: 'Peut approuver ou rejeter les photos envoyées par les invités pour la projection live. Aucun autre accès.',
    icon: 'image',
    color: 'bg-gold-light text-gold',
    badge: 'Projection live',
    badgeColor: 'bg-gold-light text-gold',
  },
  {
    id: 'checkin',
    title: 'Agent check-in',
    desc: 'Accès à un écran de scan QR code uniquement. Valide les entrées des invités le jour J. Aucune donnée visible.',
    icon: 'scan-line',
    color: 'bg-success-light text-success',
    badge: 'Jour J',
    badgeColor: 'bg-success-light text-success',
  },
];

const COLLABS = [
  {
    name: 'Mariama Balde',
    role: 'Co-organisatrice',
    roleId: 'coorg' as const,
    status: 'Active',
    phone: '+221 77 111 22 33',
    index: 0,
  },
  {
    name: 'Kofi Mensah',
    role: 'Modérateur photo',
    roleId: 'moderateur' as const,
    status: 'Invité',
    phone: '+233 24 444 55 66',
    index: 1,
  },
  {
    name: 'Mamadou Diallo',
    role: 'Agent check-in',
    roleId: 'checkin' as const,
    status: 'Prêt',
    phone: '+221 78 777 88 99',
    index: 2,
  },
];

const ROLE_COLORS: Record<RoleId, string> = {
  coorg: 'bg-secondary text-secondary-foreground',
  moderateur: 'bg-gold-light text-gold',
  checkin: 'bg-success-light text-success',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-success',
  Invité: 'text-warning',
  Prêt: 'text-primary',
};

const PERMS = [
  { perm: 'Voir les invités', coorg: true, mod: false, checkin: false },
  { perm: 'Envoyer invitations', coorg: true, mod: false, checkin: false },
  { perm: 'Modérer photos', coorg: true, mod: true, checkin: false },
  { perm: 'Scanner QR entrée', coorg: true, mod: false, checkin: true },
  { perm: 'Voir budget', coorg: true, mod: false, checkin: false },
  { perm: 'Modifier cérémonie', coorg: false, mod: false, checkin: false },
];

export default function CoOrganizersPage() {
  const [selectedRole, setSelectedRole] = useState<RoleId>('checkin');

  return (
    <AppLayout pageTitle="Co-organisateurs" tier="premium">
      <PreviewBanner />

      <AlertBanner
        type="info"
        message="Invitez vos proches à vous aider sans leur donner accès à tout. Chaque rôle a des permissions précises."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-6">
        {/* Left — Add collaborator */}
        <div className="flex flex-col gap-5">
          <PageHeader
            title="Ajouter un collaborateur"
            subtitle="Choisissez un rôle et invitez par lien ou numéro"
          />

          <div className="flex flex-col gap-3">
            {ROLES.map((role) => {
              const active = role.id === selectedRole;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`border-2 rounded-xl p-4 flex gap-4 items-start text-left transition-colors ${
                    active
                      ? 'border-primary bg-secondary'
                      : 'border-border bg-card hover:border-primary/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${role.color}`}
                  >
                    <Icon name={role.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-body font-bold text-sm text-foreground">
                        {role.title}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${role.badgeColor}`}
                      >
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      active ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  >
                    {active && <Icon name="check" size={10} className="text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <h3 className="font-headings font-bold text-base text-foreground">
              Inviter ce collaborateur
            </h3>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="collab-name"
                className="text-sm font-body font-medium text-foreground"
              >
                Nom
              </label>
              <input
                id="collab-name"
                defaultValue="Mamadou Diallo"
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="collab-phone"
                className="text-sm font-body font-medium text-foreground"
              >
                Téléphone ou email
              </label>
              <input
                id="collab-phone"
                defaultValue="+221 78 777 88 99"
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="bg-success-light border border-success rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="link-2" size={14} className="text-success" />
                <span className="text-xs font-body font-bold text-success">
                  Lien de scan QR — Accès unique jour J
                </span>
              </div>
              <div className="bg-background rounded-md px-2 py-1.5 text-xs text-muted-foreground font-mono flex items-center justify-between gap-2">
                <span className="truncate">vipin.vz/checkin/abc123-secure</span>
                <button type="button" className="text-success font-bold shrink-0">
                  Copier
                </button>
              </div>
              <p className="text-xs text-success mt-2">
                Ce lien n&apos;affiche que le scanner. Aucune donnée d&apos;invité n&apos;est
                visible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 text-center bg-secondary text-secondary-foreground font-body font-bold py-3 rounded-xl text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                className="flex-1 text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <Icon name="send" size={14} />
                Envoyer l&apos;invitation
              </button>
            </div>
          </div>
        </div>

        {/* Right — Collaborators + permissions */}
        <div className="flex flex-col gap-5">
          <PageHeader
            title="Collaborateurs actifs"
            subtitle="3 personnes ont accès à cette cérémonie"
          />

          <div className="flex flex-col gap-3">
            {COLLABS.map((c, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <UserAvatar name={c.name} index={c.index} className="w-10 h-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-body font-bold text-sm text-foreground truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.phone}</div>
                </div>
                <span
                  className={`hidden sm:inline text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${ROLE_COLORS[c.roleId]}`}
                >
                  {c.role}
                </span>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-bold ${STATUS_COLORS[c.status] ?? 'text-muted-foreground'}`}
                  >
                    {c.status}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 text-muted-foreground rounded-md"
                      aria-label="Renvoyer"
                    >
                      <Icon name="send" size={12} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-danger rounded-md"
                      aria-label="Retirer"
                    >
                      <Icon name="user-x" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-headings font-bold text-base text-foreground mb-4">
              Permissions par rôle
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-4 gap-0 bg-muted px-3 py-2 text-xs font-body font-bold text-muted-foreground">
                <span>Permission</span>
                <span className="text-center">Co-org.</span>
                <span className="text-center">Modér.</span>
                <span className="text-center">Check-in</span>
              </div>
              {PERMS.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-4 gap-0 px-3 py-2.5 text-xs border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}
                >
                  <span className="text-foreground font-body truncate">{row.perm}</span>
                  <span className="text-center">{row.coorg ? '✓' : '—'}</span>
                  <span className="text-center">{row.mod ? '✓' : '—'}</span>
                  <span className="text-center">{row.checkin ? '✓' : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
