import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

type TrackMock = { stop: ReturnType<typeof mock> };

function installCamera(resolve: boolean): { tracks: TrackMock[] } {
  const tracks: TrackMock[] = [{ stop: mock(() => {}) }];
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: mock(() =>
        resolve
          ? Promise.resolve({ getTracks: () => tracks } as unknown as MediaStream)
          : Promise.reject(new Error("denied")),
      ),
    },
    configurable: true,
  });
  return { tracks };
}

async function flush() {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

describe("SelfieCapture", () => {
  beforeEach(() => {
    installCamera(true);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders 'Take a selfie' heading", async () => {
    const { SelfieCapture } = await import("./SelfieCapture");
    render(
      <SelfieCapture onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    expect(screen.getByText("Take a selfie")).toBeTruthy();
  });

  test("capture button renders with aria-label once streaming", async () => {
    const { SelfieCapture } = await import("./SelfieCapture");
    render(
      <SelfieCapture onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    await flush();
    expect(screen.getByLabelText("Capture selfie")).toBeTruthy();
  });

  test("displays error message and calls onError when camera is denied", async () => {
    installCamera(false);
    const onError = mock(() => {});
    const { SelfieCapture } = await import("./SelfieCapture");
    render(
      <SelfieCapture onCapture={mock(() => {})} onError={onError} />,
    );
    await flush();
    expect(
      screen.getByText(
        "Camera access is required for the selfie. Please enable camera permissions.",
      ),
    ).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });

  test("renders face guide element while streaming", async () => {
    const { SelfieCapture } = await import("./SelfieCapture");
    const { container } = render(
      <SelfieCapture onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    await flush();
    const guide = container.querySelector("[class*='faceGuide']");
    expect(guide).toBeTruthy();
  });

  test("stops media stream tracks on unmount", async () => {
    const { tracks } = installCamera(true);
    const { SelfieCapture } = await import("./SelfieCapture");
    const { unmount } = render(
      <SelfieCapture onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    await flush();
    unmount();
    expect(tracks[0].stop).toHaveBeenCalled();
  });
});
