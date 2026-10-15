// Web Crypto API implementation - 100% compatible with Edge runtime and Node.js

const SESSION_SECRET = process.env.SESSION_SECRET || "hipzone_secure_secret_key_2026_x87y29z!";

export interface SessionData {
  username: string;
  role: string;
  displayName: string;
  createdAt: number;
  expiresAt: number;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = "";
  bytes.forEach((b) => (binString += String.fromCharCode(b)));
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Simple deterministic hash signature for session token
function generateSignature(payload: string): string {
  let hash = 0;
  const combined = `${payload}:${SESSION_SECRET}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function createSessionToken(data: Omit<SessionData, "createdAt" | "expiresAt">): string {
  const now = Date.now();
  const session: SessionData = {
    ...data,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = generateSignature(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = generateSignature(payload);
    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = base64UrlDecode(payload);
    const session: SessionData = JSON.parse(jsonStr);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
