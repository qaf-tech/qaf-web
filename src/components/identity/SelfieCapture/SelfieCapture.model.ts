export interface SelfieCaptureProps {
  onCapture: (blob: Blob) => void;
  onError: (error: Error) => void;
}
