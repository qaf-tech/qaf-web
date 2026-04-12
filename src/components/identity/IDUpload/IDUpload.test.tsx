import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

type TrackMock = { stop: ReturnType<typeof mock> };

function installCamera(
  resolve: boolean,
): { tracks: TrackMock[]; getUserMedia: ReturnType<typeof mock> } {
  const tracks: TrackMock[] = [{ stop: mock(() => {}) }];
  const getUserMedia = mock(() =>
    resolve
      ? Promise.resolve({ getTracks: () => tracks } as unknown as MediaStream)
      : Promise.reject(new Error("denied")),
  );
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia },
    configurable: true,
  });
  return { tracks, getUserMedia };
}

async function flush() {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

describe("IDUpload", () => {
  beforeEach(() => {
    installCamera(true);
  });

  afterEach(() => {
    cleanup();
  });

  test("renders 'Front of ID' label for side=front", async () => {
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    expect(screen.getByText("Front of ID")).toBeTruthy();
  });

  test("renders 'Back of ID' label for side=back", async () => {
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="back" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    expect(screen.getByText("Back of ID")).toBeTruthy();
  });

  test("upload button carries the expected aria-label", async () => {
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    expect(
      screen.getByLabelText("Upload document from file"),
    ).toBeTruthy();
  });

  test("capture button renders with correct aria-label once streaming", async () => {
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    await flush();
    expect(screen.getByLabelText("Capture document photo")).toBeTruthy();
  });

  test("displays 'Camera unavailable' when getUserMedia rejects", async () => {
    installCamera(false);
    const onError = mock(() => {});
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={onError} />,
    );
    await flush();
    expect(
      screen.getByText("Camera unavailable — upload a photo instead."),
    ).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });

  test("file input accepts images and is hidden via the fileInput class", async () => {
    const { IDUpload } = await import("./IDUpload");
    render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    const input = screen.getByTestId("id-upload-file-input") as HTMLInputElement;
    expect(input.accept).toBe("image/*");
    expect(input.className.includes("fileInput")).toBe(true);
  });

  test("stops media stream tracks on unmount", async () => {
    const { tracks } = installCamera(true);
    const { IDUpload } = await import("./IDUpload");
    const { unmount } = render(
      <IDUpload side="front" onCapture={mock(() => {})} onError={mock(() => {})} />,
    );
    await flush();
    unmount();
    expect(tracks[0].stop).toHaveBeenCalled();
  });
});
