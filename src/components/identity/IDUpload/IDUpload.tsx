"use client";

import { useEffect, useRef, useState } from "react";
import type { IDUploadProps } from "./IDUpload.model";
import styles from "./IDUploadStyles.module.css";

type CameraState = "idle" | "streaming" | "captured" | "unavailable";

export function IDUpload({ side, onCapture, onError }: IDUploadProps) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
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
      } catch (err) {
        if (cancelled) return;
        setCameraState("unavailable");
        onError(err instanceof Error ? err : new Error("Camera unavailable"));
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
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
          setCameraState("captured");
        }
      },
      "image/jpeg",
      0.85,
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleUploadClick();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  const sideLabel = side === "front" ? "Front of ID" : "Back of ID";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.sideLabel}>{sideLabel}</p>
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
            <div className={styles.overlay} />
          </div>
        )}
        {cameraState === "unavailable" && (
          <p className={styles.errorMessage}>
            Camera unavailable — upload a photo instead.
          </p>
        )}
        {cameraState === "captured" && (
          <p className={styles.errorMessage}>Image captured.</p>
        )}
        {cameraState === "streaming" && (
          <button
            type="button"
            className={styles.captureButton}
            onClick={handleCapture}
            aria-label="Capture document photo"
          >
            Capture Photo
          </button>
        )}
        <button
          type="button"
          className={styles.uploadLink}
          onClick={handleUploadClick}
          onKeyDown={handleUploadKey}
          aria-label="Upload document from file"
        >
          Or upload from file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleFileUpload}
          data-testid="id-upload-file-input"
        />
        <canvas ref={canvasRef} className={styles.hiddenCanvas} />
      </div>
    </div>
  );
}
