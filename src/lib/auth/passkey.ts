/**
 * WebAuthn passkey wrappers for qaf-web.
 *
 * Implements passkey creation and authentication with the PRF extension so we
 * can derive deterministic seed material client-side (see
 * {@link ./seed-derivation.ts}). The module stays framework-agnostic so it
 * can be called from both Server Actions (via a thin client shim) and
 * client components.
 *
 * All config values live in domain constants defined below — no hardcoded
 * fallbacks and no runtime env lookups.
 */

import {
  type PasskeyAuthResult,
  type PasskeyCreationResult,
  PasskeyError,
} from "./passkey.model";

const PRF_SALT_INFO = "qaf-wallet-seed-v1";
const RP_NAME = "QAF Wallet";
const USER_DISPLAY_NAME = "QAF User";

/** COSE algorithm identifiers we are willing to accept from the authenticator. */
const PUB_KEY_CRED_PARAMS: PublicKeyCredentialParameters[] = [
  { alg: -7, type: "public-key" }, // ES256
  { alg: -8, type: "public-key" }, // EdDSA
];

/** Stable domain-separation salt for the PRF evaluation. */
async function generatePrfSalt(): Promise<Uint8Array> {
  const material = new TextEncoder().encode(PRF_SALT_INFO);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return new Uint8Array(digest);
}

/** Encode arbitrary bytes as base64url (no padding). */
function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Narrow `unknown` errors to the WebAuthn "user cancelled" signal. */
function isUserCancellation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as Error).name === "NotAllowedError"
  );
}

/** Read the PRF output (`prf.results.first`) from extension results, if present. */
function readPrfFirst(
  results: AuthenticationExtensionsClientOutputs,
): ArrayBuffer | null {
  const prf = (
    results as AuthenticationExtensionsClientOutputs & {
      prf?: { results?: { first?: ArrayBuffer | Uint8Array } };
    }
  ).prf;
  const first = prf?.results?.first;
  if (!first) return null;
  return first instanceof Uint8Array
    ? first.buffer.slice(first.byteOffset, first.byteOffset + first.byteLength)
    : first;
}

/** Build the PRF extension input shape once, reused by create and get. */
function prfExtension(salt: Uint8Array): AuthenticationExtensionsClientInputs {
  return {
    prf: { eval: { first: salt } },
  } as AuthenticationExtensionsClientInputs & {
    prf: { eval: { first: BufferSource } };
  };
}

/**
 * Create a new passkey with the PRF extension enabled.
 *
 * @throws {PasskeyError} with code `webauthn_not_supported`, `passkey_cancelled`,
 *   or `prf_not_supported`.
 */
export async function createPasskey(): Promise<PasskeyCreationResult> {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new PasskeyError(
      "webauthn_not_supported",
      "WebAuthn is not available in this browser.",
    );
  }

  const salt = await generatePrfSalt();
  const userId = crypto.getRandomValues(new Uint8Array(32));
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const options: PublicKeyCredentialCreationOptions = {
    rp: { name: RP_NAME, id: window.location.hostname },
    user: {
      id: userId,
      name: USER_DISPLAY_NAME,
      displayName: USER_DISPLAY_NAME,
    },
    challenge,
    pubKeyCredParams: PUB_KEY_CRED_PARAMS,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
    extensions: prfExtension(salt),
  };

  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.create({
      publicKey: options,
    })) as PublicKeyCredential | null;
  } catch (err) {
    if (isUserCancellation(err)) {
      throw new PasskeyError(
        "passkey_cancelled",
        "The passkey creation was cancelled.",
      );
    }
    throw err;
  }

  if (!credential) {
    throw new PasskeyError(
      "passkey_cancelled",
      "The passkey creation was cancelled.",
    );
  }

  const first = readPrfFirst(credential.getClientExtensionResults());
  if (!first) {
    throw new PasskeyError(
      "prf_not_supported",
      "This authenticator does not support the WebAuthn PRF extension.",
    );
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;
  const publicKeyBuffer = attestation.getPublicKey();
  const publicKey =
    publicKeyBuffer !== null
      ? new Uint8Array(publicKeyBuffer)
      : new Uint8Array(0);

  return {
    credentialId: toBase64Url(credential.rawId),
    prfOutput: new Uint8Array(first),
    publicKey,
  };
}

/**
 * Authenticate an existing passkey and re-evaluate the PRF.
 *
 * @throws {PasskeyError} with code `webauthn_not_supported`, `passkey_cancelled`,
 *   or `prf_not_supported`.
 */
export async function getPasskey(): Promise<PasskeyAuthResult> {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new PasskeyError(
      "webauthn_not_supported",
      "WebAuthn is not available in this browser.",
    );
  }

  const salt = await generatePrfSalt();
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const options: PublicKeyCredentialRequestOptions = {
    challenge,
    userVerification: "required",
    extensions: prfExtension(salt),
  };

  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.get({
      publicKey: options,
    })) as PublicKeyCredential | null;
  } catch (err) {
    if (isUserCancellation(err)) {
      throw new PasskeyError(
        "passkey_cancelled",
        "The passkey authentication was cancelled.",
      );
    }
    throw err;
  }

  if (!credential) {
    throw new PasskeyError(
      "passkey_cancelled",
      "The passkey authentication was cancelled.",
    );
  }

  const first = readPrfFirst(credential.getClientExtensionResults());
  if (!first) {
    throw new PasskeyError(
      "prf_not_supported",
      "This authenticator does not support the WebAuthn PRF extension.",
    );
  }

  const assertion = credential.response as AuthenticatorAssertionResponse;

  return {
    credentialId: toBase64Url(credential.rawId),
    prfOutput: new Uint8Array(first),
    authenticatorData: new Uint8Array(assertion.authenticatorData),
  };
}
