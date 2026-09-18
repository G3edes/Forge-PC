/**
 * Share codes.
 *
 * A build is encoded into a compact, URL-safe string so `/build/<code>` works
 * across devices with no backend at all. When a real API arrives, keep
 * `encodeBuild`/`decodeBuild` and add a short-id lookup in front of it — the
 * route already falls back to the local repository when a code is not decodable.
 */

import type { BuildComponentIds, RgbEffect, RgbSettings } from '@/types/build';
import { EMPTY_COMPONENT_IDS } from './build-utils';

const VERSION = '1';
const FIELD_SEPARATOR = '~';
const FAN_SEPARATOR = ',';
const QUANTITY_SEPARATOR = '*';
const EMPTY_SLOT = '-';

const RGB_EFFECTS: RgbEffect[] = ['static', 'breathing', 'rainbow', 'pulse'];

export const DEFAULT_RGB: RgbSettings = {
  enabled: true,
  color: '#7c5cff',
  intensity: 0.8,
  effect: 'static',
};

export interface SharePayload {
  name: string;
  componentIds: BuildComponentIds;
  rgb: RgbSettings;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(value, 'utf8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const base64 = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function encodeBuild(payload: SharePayload): string {
  const fans = payload.componentIds.fans
    .map((fan) => `${fan.id}${QUANTITY_SEPARATOR}${fan.quantity}`)
    .join(FAN_SEPARATOR);

  const fields = [
    VERSION,
    encodeURIComponent(payload.name || 'Build sem nome'),
    payload.componentIds.cpu ?? EMPTY_SLOT,
    payload.componentIds.gpu ?? EMPTY_SLOT,
    payload.componentIds.motherboard ?? EMPTY_SLOT,
    payload.componentIds.ram ?? EMPTY_SLOT,
    payload.componentIds.storage ?? EMPTY_SLOT,
    payload.componentIds.psu ?? EMPTY_SLOT,
    payload.componentIds.case ?? EMPTY_SLOT,
    payload.componentIds.cooler ?? EMPTY_SLOT,
    fans || EMPTY_SLOT,
    [
      payload.rgb.enabled ? '1' : '0',
      payload.rgb.color.replace('#', ''),
      payload.rgb.intensity.toFixed(2),
      payload.rgb.effect,
    ].join(FAN_SEPARATOR),
  ];

  return toBase64Url(fields.join(FIELD_SEPARATOR));
}

/** Returns `null` for anything that is not a valid v1 code. */
export function decodeBuild(code: string): SharePayload | null {
  if (!code) return null;

  try {
    const raw = fromBase64Url(code);
    const fields = raw.split(FIELD_SEPARATOR);
    if (fields.length < 12 || fields[0] !== VERSION) return null;

    const slot = (value: string): string | null =>
      value && value !== EMPTY_SLOT ? value : null;

    const fans = slot(fields[10])
      ? fields[10]
          .split(FAN_SEPARATOR)
          .map((entry) => {
            const [id, quantity] = entry.split(QUANTITY_SEPARATOR);
            const parsed = Number.parseInt(quantity ?? '1', 10);
            return { id, quantity: Number.isFinite(parsed) ? Math.max(1, parsed) : 1 };
          })
          .filter((entry) => Boolean(entry.id))
      : [];

    const [enabled, color, intensity, effect] = fields[11].split(FAN_SEPARATOR);
    const parsedIntensity = Number.parseFloat(intensity ?? '0.8');

    return {
      name: decodeURIComponent(fields[1] || 'Build compartilhada'),
      componentIds: {
        ...EMPTY_COMPONENT_IDS,
        cpu: slot(fields[2]),
        gpu: slot(fields[3]),
        motherboard: slot(fields[4]),
        ram: slot(fields[5]),
        storage: slot(fields[6]),
        psu: slot(fields[7]),
        case: slot(fields[8]),
        cooler: slot(fields[9]),
        fans,
      },
      rgb: {
        enabled: enabled === '1',
        color: `#${(color ?? '7c5cff').replace('#', '')}`,
        intensity: Number.isFinite(parsedIntensity) ? parsedIntensity : 0.8,
        effect: RGB_EFFECTS.includes(effect as RgbEffect) ? (effect as RgbEffect) : 'static',
      },
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(code: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/build/${code}`;
}
