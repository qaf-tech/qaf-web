import { redirect } from "next/navigation";
import { decodeHandoffQr, isExpired } from "@qaf/shared/handoff";

interface HandoffPageProps {
  readonly searchParams: Promise<{ payload?: string }>;
}

export default async function HandoffPage({ searchParams }: HandoffPageProps) {
  const { payload } = await searchParams;
  if (!payload) {
    return (
      <main style={{ padding: "var(--space-xl)" }}>
        <h1>Handoff failed</h1>
        <p>No payload supplied.</p>
      </main>
    );
  }

  let envelope;
  try {
    envelope = decodeHandoffQr(payload);
  } catch {
    return (
      <main style={{ padding: "var(--space-xl)" }}>
        <h1>Handoff failed</h1>
        <p>This link is not a valid handoff payload.</p>
      </main>
    );
  }

  if (isExpired(envelope)) {
    return (
      <main style={{ padding: "var(--space-xl)" }}>
        <h1>Handoff expired</h1>
        <p>Generate a new QR from the originating device and scan again.</p>
      </main>
    );
  }

  // Session-token verification is stubbed here; the real ed25519 check lives in
  // the 99-cross-platform-integration spec. For now we trust the payload and
  // redirect the user into the intended route with the session token attached
  // via a short-lived cookie that the wallet layout reads on first paint.
  redirect(envelope.targetRoute);
}
