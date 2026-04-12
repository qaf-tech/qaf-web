"use client";

import { useEffect, useRef, useState } from "react";
import type { SelfieCaptureProps } from "./SelfieCapture.model";
import styles from "./SelfieCaptureStyles.module.css";

type CameraState = "idle" | "streaming" | "error";

const PERMISSION_ERROR_MESSAGE =
  "Camera access is required for the selfie. Please enable camera permissions.";

export function SelfieCapture({ onCapture, onError }: SelfieCaptureProps) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState("streaming");
      } catch {
        if (cancelled) return;
        setCameraState("error");
        onError(new Error(PERMISSION_ERROR_MESSAGE));
      }
    };
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [onError]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.85,
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>Take a selfie</h2>
        {cameraState === "streaming" && (
          <div className={styles.viewfinder}>
            {/* biome-ignore lint/a11y/useMediaCaption: live camera preview has no caption track */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.video}
            />
            <div className={styles.faceGuide} />
          </div>
        )}
        {cameraState === "error" && (
          <p className={styles.errorMessage}>{PERMISSION_ERROR_MESSAGE}</p>
        )}
        {cameraState === "streaming" && (
          <button
            type="button"
            className={styles.captureButton}
            onClick={handleCapture}
            aria-label="Capture selfie"
          >
            Capture Selfie
          </button>
        )}
        <canvas ref={canvasRef} className={styles.hiddenCanvas} />
      </div>
    </div>
  );
}
