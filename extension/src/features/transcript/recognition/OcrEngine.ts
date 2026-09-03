import {
  PaddleOCR,
  type OcrResultItem,
  type PaddleOCRCreateOptions
} from "@paddleocr/paddleocr-js";
import { LanguageRouter, type OcrRouteSnapshot } from "./LanguageRouter";
import {
  OCR_LANGUAGE_REGISTRY,
  type OcrLanguage,
  type OcrLanguageRegistryEntry
} from "./languageRegistry";

export type OcrProgress = {
  progress: number;
  status: string;
};

export type OcrResult = {
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

type PaddleOcrInstance = Awaited<ReturnType<typeof PaddleOCR.create>>;

type RecognizedFrame = {
  confidence: number;
  detectedBoxes: number;
  recognizedCount: number;
  selectedCount: number;
  text: string;
};

const OCR_RUNTIME_PARAMS = {
  textDetBoxThresh: 0.35,
  textDetLimitSideLen: 960,
  textDetLimitType: "max" as const,
  textDetThresh: 0.2,
  textRecScoreThresh: 0.4
};

export class OcrEngine {
  #loading = new Map<string, Promise<PaddleOcrInstance>>();
  #models = new Map<string, PaddleOcrInstance>();
  #router = new LanguageRouter();

  constructor(readonly onProgress: (progress: OcrProgress) => void) {}

  async recognize(image: HTMLCanvasElement): Promise<OcrResult> {
    const frameCache = new Map<string, RecognizedFrame>();

    return this.#router.route(OCR_LANGUAGE_REGISTRY, async (entry) => {
      if (entry.model.status === "unavailable") {
        return null;
      }

      if (!frameCache.has(entry.modelKey)) {
        frameCache.set(entry.modelKey, await this.#recognizeWithModel(entry, image));
      }

      return frameCache.get(entry.modelKey) ?? null;
    });
  }

  getRouteSnapshot() {
    return this.#router.snapshot;
  }

  resetSession() {
    this.#router.reset();
  }

  async terminate() {
    const models = [...this.#models.values()];
    this.#models.clear();
    this.#loading.clear();
    this.#router.reset();

    for (const model of models) {
      await model.dispose();
    }
  }

  async #recognizeWithModel(
    entry: OcrLanguageRegistryEntry,
    image: HTMLCanvasElement
  ): Promise<RecognizedFrame> {
    const ocr = await this.#getOcr(entry);
    const [result] = await ocr.predict(image, OCR_RUNTIME_PARAMS);
    const items = selectSubtitleLines(result.items, result.image.width);
    const confidence = items.length
      ? items.reduce((sum, item) => sum + item.score, 0) / items.length
      : 0;

    return {
      confidence: confidence * 100,
      detectedBoxes: result.metrics.detectedBoxes,
      recognizedCount: result.metrics.recognizedCount,
      selectedCount: items.length,
      text: items.map((item) => item.text).join("\n")
    };
  }

  async #getOcr(entry: OcrLanguageRegistryEntry) {
    const cached = this.#models.get(entry.modelKey);
    if (cached) {
      return cached;
    }

    let loading = this.#loading.get(entry.modelKey);
    if (!loading) {
      loading = this.#createOcr(entry);
      this.#loading.set(entry.modelKey, loading);
    }

    try {
      const ocr = await loading;
      this.#models.set(entry.modelKey, ocr);
      return ocr;
    } catch (caughtError) {
      this.#loading.delete(entry.modelKey);
      throw caughtError;
    }
  }

  async #createOcr(entry: OcrLanguageRegistryEntry) {
    if (entry.model.status === "unavailable") {
      throw new Error(entry.model.reason);
    }

    this.onProgress({
      progress: 0.08,
      status: `加载 ${entry.label} OCR 模型`
    });

    const ocr = await PaddleOCR.create({
      ...entry.model.createOptions,
      ortOptions: {
        backend: "wasm",
        numThreads: 1,
        proxy: false,
        simd: true,
        wasmPaths: chrome.runtime.getURL("ocr/ort/")
      },
      worker: false
    } satisfies PaddleOCRCreateOptions);

    this.onProgress({ progress: 1, status: entry.model.readyStatus });
    return ocr;
  }
}

function bounds(item: OcrResultItem) {
  const xValues = item.poly.map((point) => point[0]);
  return {
    left: Math.min(...xValues),
    right: Math.max(...xValues)
  };
}

function selectSubtitleLines(items: OcrResultItem[], imageWidth: number) {
  return items
    .filter((item) => {
      const box = bounds(item);
      const centerX = (box.left + box.right) / 2;
      const width = box.right - box.left;

      return (
        item.score >= 0.4 &&
        centerX >= imageWidth * 0.05 &&
        centerX <= imageWidth * 0.95 &&
        width >= imageWidth * 0.015
      );
    })
    .sort((left, right) => {
      const leftY = Math.min(...left.poly.map((point) => point[1]));
      const rightY = Math.min(...right.poly.map((point) => point[1]));
      return leftY - rightY;
    })
    .slice(0, 2);
}
