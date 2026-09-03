import type {
  OcrLanguage,
  OcrLanguageRegistryEntry
} from "./languageRegistry";
import { countScript, evaluateLanguageEntrySignal } from "./languageRegistry";

export type ScriptCounts = {
  han: number;
  hangul: number;
  kana: number;
  latin: number;
  total: number;
};

export type OcrRouteEvaluation = {
  confidence: number;
  detectedBoxes: number;
  language: OcrLanguage;
  label: string;
  modelKey: string;
  recognizedCount: number;
  reason: string;
  requiredSamples: number;
  scriptMatched: boolean;
  selectedCount: number;
  stableSamples: number;
  status: "matched" | "not-matched" | "unavailable";
  text: string;
};

export type OcrRouteSnapshot = {
  activeLabel: string;
  activeLanguage: OcrLanguage | "unknown";
  activeModelKey: string | null;
  evaluations: readonly OcrRouteEvaluation[];
  lockedLanguage: OcrLanguage | null;
  status: "probing" | "locked";
};

export type OcrRoutedResult = {
  confidence: number;
  detectedBoxes: number;
  language: OcrLanguage | "unknown";
  languageLabel: string;
  lockedLanguage: OcrLanguage | null;
  modelKey: string | null;
  recognizedCount: number;
  route: OcrRouteSnapshot;
  selectedCount: number;
  text: string;
};

type RecognizedFrame = {
  confidence: number;
  detectedBoxes: number;
  recognizedCount: number;
  selectedCount: number;
  text: string;
};

type CandidateState = {
  language: OcrLanguage;
  normalizedText: string;
  samples: number;
};

const UNKNOWN_SNAPSHOT: OcrRouteSnapshot = {
  activeLabel: "检测中",
  activeLanguage: "unknown",
  activeModelKey: null,
  evaluations: [],
  lockedLanguage: null,
  status: "probing"
};

export function countScripts(text: string): ScriptCounts {
  const han = countScript(text, "Han");
  const hangul = countScript(text, "Hangul");
  const kana = countScript(text, "Kana");
  const latin = countScript(text, "Latin");

  return {
    han,
    hangul,
    kana,
    latin,
    total: han + hangul + kana + latin
  };
}

function normalizedForRouting(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

export class LanguageRouter {
  #candidate: CandidateState | null = null;
  #locked: OcrLanguage | null = null;
  #snapshot: OcrRouteSnapshot = UNKNOWN_SNAPSHOT;

  get lockedLanguage() {
    return this.#locked;
  }

  get snapshot() {
    return this.#snapshot;
  }

  reset() {
    this.#candidate = null;
    this.#locked = null;
    this.#snapshot = UNKNOWN_SNAPSHOT;
  }

  async route(
    registry: readonly OcrLanguageRegistryEntry[],
    getFrame: (
      entry: OcrLanguageRegistryEntry
    ) => Promise<RecognizedFrame | null>
  ): Promise<OcrRoutedResult> {
    const lockedEntry = this.#locked
      ? registry.find((entry) => entry.language === this.#locked)
      : null;
    const entries = lockedEntry ? [lockedEntry] : registry;
    const evaluations: OcrRouteEvaluation[] = [];
    let bestFrame: (RecognizedFrame & { modelKey: string }) | null = null;

    for (const entry of entries) {
      if (entry.model.status === "unavailable") {
        evaluations.push({
          confidence: 0,
          detectedBoxes: 0,
          language: entry.language,
          label: entry.label,
          modelKey: entry.modelKey,
          recognizedCount: 0,
          reason: entry.model.reason,
          requiredSamples: entry.minStableSamples,
          scriptMatched: false,
          selectedCount: 0,
          stableSamples: 0,
          status: "unavailable",
          text: ""
        });
        continue;
      }

      const frame = await getFrame(entry);
      if (!frame) {
        continue;
      }

      if (!bestFrame || frame.confidence > bestFrame.confidence) {
        bestFrame = { ...frame, modelKey: entry.modelKey };
      }

      const signal = evaluateLanguageEntrySignal(entry, frame.text);
      const highConfidence = frame.confidence >= entry.minConfidence;
      const matched = signal.matched && highConfidence;
      const normalizedText = normalizedForRouting(frame.text);
      const stableSamples = matched
        ? this.#nextStableSamples(entry.language, normalizedText)
        : 0;

      const evaluation: OcrRouteEvaluation = {
        confidence: frame.confidence,
        detectedBoxes: frame.detectedBoxes,
        language: entry.language,
        label: entry.label,
        modelKey: entry.modelKey,
        recognizedCount: frame.recognizedCount,
        reason: highConfidence ? signal.reason : "置信度不足",
        requiredSamples: entry.minStableSamples,
        scriptMatched: signal.matched,
        selectedCount: frame.selectedCount,
        stableSamples,
        status: matched ? "matched" : "not-matched",
        text: frame.text
      };
      evaluations.push(evaluation);

      if (!matched) {
        continue;
      }

      this.#candidate = {
        language: entry.language,
        normalizedText,
        samples: stableSamples
      };

      if (stableSamples >= entry.minStableSamples) {
        this.#locked = entry.language;
      }

      this.#snapshot = {
        activeLabel: entry.label,
        activeLanguage: entry.language,
        activeModelKey: entry.modelKey,
        evaluations,
        lockedLanguage: this.#locked,
        status: this.#locked ? "locked" : "probing"
      };

      return {
        confidence: frame.confidence,
        detectedBoxes: frame.detectedBoxes,
        language: entry.language,
        languageLabel: entry.label,
        lockedLanguage: this.#locked,
        modelKey: entry.modelKey,
        recognizedCount: frame.recognizedCount,
        route: this.#snapshot,
        selectedCount: frame.selectedCount,
        text: frame.text
      };
    }

    this.#candidate = null;
    this.#snapshot = {
      activeLabel: lockedEntry?.label ?? "检测中",
      activeLanguage: this.#locked ?? "unknown",
      activeModelKey: bestFrame?.modelKey ?? null,
      evaluations,
      lockedLanguage: this.#locked,
      status: this.#locked ? "locked" : "probing"
    };

    return {
      confidence: bestFrame?.confidence ?? 0,
      detectedBoxes: bestFrame?.detectedBoxes ?? 0,
      language: this.#locked ?? "unknown",
      languageLabel: lockedEntry?.label ?? "检测中",
      lockedLanguage: this.#locked,
      modelKey: bestFrame?.modelKey ?? null,
      recognizedCount: bestFrame?.recognizedCount ?? 0,
      route: this.#snapshot,
      selectedCount: bestFrame?.selectedCount ?? 0,
      text: ""
    };
  }

  #nextStableSamples(language: OcrLanguage, normalizedText: string) {
    const candidate = this.#candidate;
    if (
      candidate?.language === language &&
      candidate.normalizedText === normalizedText
    ) {
      return candidate.samples + 1;
    }

    return 1;
  }
}
