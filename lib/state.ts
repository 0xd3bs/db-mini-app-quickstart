export type AhpState = {
  goal: string;
  options: string[];
  values: Record<string, number>;
  pairIndex: number;
};

export function encodeStateToUrlParam(state: AhpState): string {
  const json = JSON.stringify(state);
  const b64 = (typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64'));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeStateFromUrlParam(param: string): AhpState | null {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = (typeof window !== 'undefined' ? decodeURIComponent(escape(window.atob(pad))) : Buffer.from(pad, 'base64').toString('utf8'));
    const obj = JSON.parse(json) as AhpState;
    if (!obj || !Array.isArray(obj.options) || obj.options.length < 2) return null;
    return obj;
  } catch {
    return null;
  }
}
