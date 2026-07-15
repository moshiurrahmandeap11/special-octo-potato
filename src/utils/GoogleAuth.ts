import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import dotenv from "dotenv";
import { createPublicKey, type JsonWebKey } from "node:crypto";

dotenv.config();

const GOOGLE_TOKEN_ISSUERS: [string, string] = [
  "https://accounts.google.com",
  "accounts.google.com",
];
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

interface JWK {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
  use: string;
}

/**
 * Fetches Google's public signing keys (JWKS) and returns a resolver for
 * jsonwebtoken's `jwt.verify` `key` callback.
 */
const getKey = async (header: JwtHeader, callback: SigningKeyCallback): Promise<void> => {
  try {
    const res = await fetch(GOOGLE_JWKS_URL);
    if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
    const data = (await res.json()) as { keys: JWK[] };
    const key = data.keys.find((k) => k.kid === header.kid);
    if (!key) {
      callback(new Error("Unable to find matching Google signing key."));
      return;
    }
    const publicKey = createPublicKey({ key: key as unknown as JsonWebKey, format: "jwk" });
    callback(null, publicKey);
  } catch (err) {
    callback(err as Error);
  }
};

/**
 * Verifies a Google OAuth ID token (sent by the client after the Google
 * redirect) using Google's public keys, and returns the user profile.
 */
export const verifyGoogleToken = (idToken: string): Promise<GoogleUserInfo> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: process.env.GOOGLE_CLIENT_ID,
        issuer: GOOGLE_TOKEN_ISSUERS,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err || !decoded) {
          reject(new Error(`Google token verification failed: ${err?.message ?? "unknown"}`));
          return;
        }
        const payload = decoded as Record<string, unknown>;
        if (!payload.email) {
          reject(new Error("Google token missing email."));
          return;
        }
        if (payload.email_verified !== true) {
          reject(new Error("Google account email is not verified."));
          return;
        }
        resolve({
          email: String(payload.email),
          name: (payload.name as string) ?? String(payload.email).split("@")[0],
          picture: (payload.picture as string) ?? "",
          emailVerified: Boolean(payload.email_verified),
        });
      }
    );
  });
};
