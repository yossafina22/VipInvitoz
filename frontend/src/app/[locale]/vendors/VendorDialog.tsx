'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { uploadFile } from '@/lib/upload-client';
import { normalizePhone } from '@/lib/vendors/contact';
import { parseAmountInput } from '../budget/budget-types';

export interface VendorDto {
  id: string;
  presetKey: string | null;
  name: string;
  imageUrl: string | null;
  phone: string | null;
  amount: string;
  paid: boolean;
}

export interface VendorPayload {
  name: string;
  amount: number;
  paid: boolean;
  phone: string | null;
  imageUrl: string | null;
}

interface VendorDialogProps {
  initial: VendorDto | null;
  defaultName: string;
  error: string | null;
  onClose: () => void;
  onSave: (payload: VendorPayload) => Promise<void>;
}

const INPUT =
  'w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary';
const LABEL = 'text-xs text-muted-foreground';

export function VendorDialog({ initial, defaultName, error, onClose, onSave }: VendorDialogProps) {
  const t = useTranslations('vendors.dialog');
  const tErr = useTranslations('vendors.errors');
  const [name, setName] = useState(initial?.name ?? defaultName);
  const [amount, setAmount] = useState(initial ? initial.amount.replace(/\.00$/, '') : '');
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountNum = amount.trim() === '' ? 0 : parseAmountInput(amount);
  const phoneNormalized = phone.trim() === '' ? null : normalizePhone(phone);
  const phoneInvalid = phone.trim() !== '' && phoneNormalized === null;
  const valid =
    name.trim().length > 0 && Number.isFinite(amountNum) && amountNum >= 0 && !phoneInvalid;

  async function pickImage(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setImageUrl(uploaded.url);
    } catch {
      setUploadError(tErr('upload'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!valid || saving || uploading) return;
    setSaving(true);
    await onSave({ name: name.trim(), amount: amountNum, paid, phone: phoneNormalized, imageUrl });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={() => !saving && !uploading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-card border border-border rounded-xl p-5 max-w-md w-full flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headings font-bold text-base text-foreground">
          {initial ? t('editTitle') : t('createTitle')}
        </h3>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{t('name')}</span>
          <input
            autoFocus
            value={name}
            maxLength={80}
            placeholder={t('namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
          />
        </label>

        <div className="flex gap-3 items-end">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className={LABEL}>{t('amount')}</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${INPUT} tabular-nums`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4"
            />
            {t('paid')}
          </label>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">{t('budgetNote')}</p>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{t('phone')}</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            placeholder={t('phonePlaceholder')}
            onChange={(e) => setPhone(e.target.value)}
            className={`${INPUT} ${phoneInvalid ? 'border-danger' : ''}`}
          />
          <span className={`text-xs ${phoneInvalid ? 'text-danger' : 'text-muted-foreground'}`}>
            {phoneInvalid ? t('phoneInvalid') : t('phoneHint')}
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>{t('image')}</span>
          {imageUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={imageUrl}
                alt=""
                className="w-16 h-16 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs text-danger font-bold"
              >
                {t('imageRemove')}
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm text-primary font-bold cursor-pointer w-fit">
              <Icon name="image-plus" size={16} />
              {uploading ? t('imageUploading') : t('imagePick')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickImage(f);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {uploadError && <span className="text-xs text-danger">{uploadError}</span>}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
            className="flex-1 py-2 text-sm text-muted-foreground"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!valid || saving || uploading}
            className="flex-1 bg-primary text-primary-foreground font-body font-bold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
