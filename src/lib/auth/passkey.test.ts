import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createPasskey, getPasskey } from "./passkey";
import { PasskeyError } from "./passkey.model";

/**
 * `navigator.credentials` is not exposed by happy-dom. We stub it on the
 * global navigator for each test and restore the original afterwards so
 * tests stay isolated.
 */
type CredentialsLike = {
  create?: (options: unknown) => Promise<unknown>;
  get?: (options: unknown) => Promise<unknown>;
};

type MutableNavigator = Navigator & {
  credentials?: CredentialsLike;
};

const navRef = (): MutableNavigator => navigator as MutableNavigator;

function setCredentials(value: CredentialsLike | undefined): void {
  if (value === undefined) {
    Object.defineProperty(navigator, "credentials", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  } else {
    Object.defineProperty(navigator, "credentials", {
      value,
      configurable: true,
      writable: true,
    });
  }
}

let originalCredentials: CredentialsLike | undefined;

beforeEach(() => {
  originalCredentials = navRef().credentials;
});

afterEach(() => {
  setCredentials(originalCredentials);
});

function cancelledError(): Error {
  return Object.assign(new Error("user cancelled"), {
    name: "NotAllowedError",
  });
}

function fakeCredential(params: {
  rawId: ArrayBuffer;
  prfFirst: ArrayBuffer | null;
  publicKey?: ArrayBuffer | null;
  authenticatorData?: ArrayBuffer;
}): unknown {
  const {
    rawId,
    prfFirst,
    publicKey = new ArrayBuffer(65),
    authenticatorData = new ArrayBuffer(37),
  } = params;

  return {
    rawId,
    getClientExtensionResults: () =>
      prfFirst === null ? {} : { prf: { results: { first: prfFirst } } },
    response: {
      getPublicKey: () => publicKey,
      authenticatorData,
    },
  };
}

describe("createPasskey", () => {
  test("throws webauthn_not_supported when navigator.credentials is undefined", async () => {
    setCredentials(undefined);

    await expect(createPasskey()).rejects.toMatchObject({
      name: "PasskeyError",
      code: "webauthn_not_supported",
    });
  });

  test("throws passkey_cancelled when create() rejects with NotAllowedError", async () => {
    setCredentials({
      create: mock(() => Promise.reject(cancelledError())),
    });

    await expect(createPasskey()).rejects.toMatchObject({
      name: "PasskeyError",
      code: "passkey_cancelled",
    });
  });

  test("throws prf_not_supported when the PRF extension result is missing", async () => {
    setCredentials({
      create: mock(() =>
        Promise.resolve(
          fakeCredential({
            rawId: new Uint8Array([1, 2, 3, 4]).buffer,
            prfFirst: null,
          }),
        ),
      ),
    });

    await expect(createPasskey()).rejects.toBeInstanceOf(PasskeyError);
    await expect(createPasskey()).rejects.toMatchObject({
      code: "prf_not_supported",
    });
  });

  test("returns credentialId, prfOutput, publicKey on success", async () => {
    const rawId = new Uint8Array([10, 20, 30, 40]).buffer;
    const prfFirst = new Uint8Array(32).fill(7).buffer;
    const spki = new Uint8Array([9, 9, 9, 9, 9]).buffer;

    setCredentials({
      create: mock(() =>
        Promise.resolve(fakeCredential({ rawId, prfFirst, publicKey: spki })),
      ),
    });

    const result = await createPasskey();

    expect(typeof result.credentialId).toBe("string");
    expect(result.credentialId.length).toBeGreaterThan(0);
    expect(result.prfOutput).toBeInstanceOf(Uint8Array);
    expect(result.prfOutput.length).toBe(32);
    expect(result.publicKey).toBeInstanceOf(Uint8Array);
    expect(result.publicKey.length).toBe(5);
  });
});

describe("getPasskey", () => {
  test("throws passkey_cancelled when get() rejects with NotAllowedError", async () => {
    setCredentials({
      get: mock(() => Promise.reject(cancelledError())),
    });

    await expect(getPasskey()).rejects.toMatchObject({
      name: "PasskeyError",
      code: "passkey_cancelled",
    });
  });

  test("returns credentialId, prfOutput, authenticatorData on success", async () => {
    const rawId = new Uint8Array([1, 1, 2, 3, 5]).buffer;
    const prfFirst = new Uint8Array(32).fill(3).buffer;
    const authData = new Uint8Array([0xaa, 0xbb, 0xcc]).buffer;

    setCredentials({
      get: mock(() =>
        Promise.resolve(
          fakeCredential({
            rawId,
            prfFirst,
            authenticatorData: authData,
          }),
        ),
      ),
    });

    const result = await getPasskey();

    expect(typeof result.credentialId).toBe("string");
    expect(result.credentialId.length).toBeGreaterThan(0);
    expect(result.prfOutput).toBeInstanceOf(Uint8Array);
    expect(result.prfOutput.length).toBe(32);
    expect(result.authenticatorData).toBeInstanceOf(Uint8Array);
    expect(result.authenticatorData.length).toBe(3);
  });
});
