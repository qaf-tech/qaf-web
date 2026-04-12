import { describe, expect, test } from "bun:test";
import {
  commitmentToHex,
  createCommitment,
  generateCommitment,
} from "./commitment";

describe("commitment helpers", () => {
  test("generateCommitment returns a 32-byte Uint8Array", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    const hash = await generateCommitment(input);
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  test("generateCommitment is deterministic", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    const a = await generateCommitment(input);
    const b = await generateCommitment(input);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  test("generateCommitment differs for different inputs", async () => {
    const a = await generateCommitment(new Uint8Array([1, 2, 3]));
    const b = await generateCommitment(new Uint8Array([4, 5, 6]));
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  test("commitmentToHex returns a 64-character lowercase hex string", async () => {
    const hash = await generateCommitment(new Uint8Array([0]));
    const hex = commitmentToHex(hash);
    expect(hex.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hex)).toBe(true);
  });

  test("createCommitment returns both hash (Uint8Array) and hex (string)", async () => {
    const blob = new Uint8Array([42]);
    const c = await createCommitment(blob);
    expect(c.hash).toBeInstanceOf(Uint8Array);
    expect(typeof c.hex).toBe("string");
  });

  test("createCommitment hex matches commitmentToHex(hash)", async () => {
    const blob = new Uint8Array([42]);
    const c = await createCommitment(blob);
    expect(c.hex).toBe(commitmentToHex(c.hash));
  });
});
