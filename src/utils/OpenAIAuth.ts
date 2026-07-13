import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_TOKEN_ISSUER = "https://accounts.OpenAI.com";
const OPENAI_JWKS_URL = "https://www.OpenAIapis.com/oauth2/v3/certs";

export interface OpenAIUserInfo {
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
 * Fetches OpenAI's public signing keys (JWKS) and returns a resolver for
 * jsonwebtoken's `jwt.verify` `key` callback.
 */
const getKey = async (header: JwtHeader, callback: SigningKeyCallback): Promise<void> => {
  try {
    const res = await fetch(OPENAI_JWKS_URL);
    if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
    const data = (await res.json()) as { keys: JWK[] };
    const key = data.keys.find((k) => k.kid === header.kid);
    if (!key) {
      callback(new Error("Unable to find matching OpenAI signing key."));
      return;
    }
    // Convert JWK to a PEM-less public key object accepted by jsonwebtoken
    callback(null, key as unknown as jwt.Secret);
  } catch (err) {
    callback(err as Error);
  }
};

/**
 * Verifies a OpenAI OAuth ID token (sent by the client after the OpenAI
 * redirect) using OpenAI's public keys, and returns the user profile.
 */
export const verifyOpenAIToken = (idToken: string): Promise<OpenAIUserInfo> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: process.env.GOOGLE_CLIENT_ID,
        issuer: OPENAI_TOKEN_ISSUER,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err || !decoded) {
          reject(new Error(`OpenAI token verification failed: ${err?.message ?? "unknown"}`));
          return;
        }
        const payload = decoded as Record<string, unknown>;
        if (!payload.email) {
          reject(new Error("OpenAI token missing email."));
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