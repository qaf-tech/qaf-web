export interface IDUploadProps {
  side: "front" | "back";
  onCapture: (blob: Blob) => void;
  onError: (error: Error) => void;
}
