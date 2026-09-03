export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
  samples: number;
};

export type OcrAttempt = {
  videoTime: number;
  durationMs: number;
  confidence: number;
  detectedBoxes: number;
  failureReason?: string;
  languageLabel: string;
  lockedLanguage: string | null;
  modelKey: string | null;
  recognizedCount: number;
  routeStatus: "probing" | "locked";
  selectedCount: number;
  text: string;
};

export type OcrTestStatus =
  | "idle"
  | "loading"
  | "scanning"
  | "paused"
  | "stopped"
  | "error";
