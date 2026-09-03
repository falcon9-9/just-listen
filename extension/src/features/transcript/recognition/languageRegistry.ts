import type { PaddleOCRCreateOptions } from "@paddleocr/paddleocr-js";

export type OcrLanguage = string;

export type OcrScript = "Han" | "Latin" | "Kana" | "Hangul";

export type OcrModelAvailability =
  | {
      createOptions: Partial<Pick<
        PaddleOCRCreateOptions,
        | "lang"
        | "ocrVersion"
        | "pipelineConfig"
        | "textDetectionModelAsset"
        | "textDetectionModelName"
        | "textRecognitionModelAsset"
        | "textRecognitionModelName"
      >>;
      readyStatus: string;
      status: "available";
    }
  | {
      reason: string;
      status: "unavailable";
    };

export type OcrLanguageRegistryEntry = {
  excludedScripts?: readonly OcrScript[];
  label: string;
  language: OcrLanguage;
  minConfidence: number;
  minScriptCharacters: number;
  minScriptShare: number;
  minStableSamples: number;
  modelKey: string;
  model: OcrModelAvailability;
  requiredAnyScripts: readonly OcrScript[];
  scripts: readonly OcrScript[];
};

const CJK_MODEL: OcrModelAvailability = {
  createOptions: {
    lang: "ch",
    ocrVersion: "PP-OCRv5"
  },
  readyStatus: "PP-OCRv5 CJK 已就绪",
  status: "available"
};

export const OCR_LANGUAGE_REGISTRY = [
  {
    label: "中文",
    language: "zh",
    excludedScripts: ["Kana", "Hangul"],
    minConfidence: 70,
    minScriptCharacters: 2,
    minScriptShare: 0.5,
    minStableSamples: 3,
    model: CJK_MODEL,
    modelKey: "pp-ocrv5-cjk",
    requiredAnyScripts: ["Han"],
    scripts: ["Han"]
  },
  {
    label: "英文",
    language: "en",
    minConfidence: 60,
    minScriptCharacters: 3,
    minScriptShare: 0.5,
    minStableSamples: 2,
    model: CJK_MODEL,
    modelKey: "pp-ocrv5-cjk",
    requiredAnyScripts: ["Latin"],
    scripts: ["Latin"]
  },
  {
    label: "日文",
    language: "ja",
    minConfidence: 60,
    minScriptCharacters: 1,
    minScriptShare: 0.5,
    minStableSamples: 2,
    model: CJK_MODEL,
    modelKey: "pp-ocrv5-cjk",
    requiredAnyScripts: ["Kana"],
    scripts: ["Kana", "Han"]
  },
  {
    label: "韩文",
    language: "ko",
    minConfidence: 60,
    minScriptCharacters: 2,
    minScriptShare: 0.5,
    minStableSamples: 2,
    model: {
      reason: "韩语 OCR 识别模型尚未配置。",
      status: "unavailable"
    },
    modelKey: "pp-ocrv5-ko",
    requiredAnyScripts: ["Hangul"],
    scripts: ["Hangul"]
  }
] as const satisfies readonly OcrLanguageRegistryEntry[];

export function getRegistryEntry(language: OcrLanguage) {
  return OCR_LANGUAGE_REGISTRY.find((entry) => entry.language === language) ?? null;
}

export function getOcrModelGroup(entry: OcrLanguageRegistryEntry) {
  return entry.model.status === "available"
    ? {
        key: entry.modelKey,
        label: entry.modelKey,
        paddleLang: entry.model.createOptions.lang,
        status: entry.model.status,
        unavailableReason: undefined
      }
    : {
        key: entry.modelKey,
        label: entry.modelKey,
        paddleLang: undefined,
        status: entry.model.status,
        unavailableReason: entry.model.reason
      };
}

export function getOcrLanguageSummary() {
  return OCR_LANGUAGE_REGISTRY.map((entry) =>
    entry.model.status === "available" ? entry.label : `${entry.label}待接入`
  ).join("/");
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

export function countScript(text: string, script: OcrScript) {
  switch (script) {
    case "Han":
      return countMatches(text, /\p{Script=Han}/gu);
    case "Latin":
      return countMatches(text, /\p{Script=Latin}/gu);
    case "Kana":
      return (
        countMatches(text, /\p{Script=Hiragana}/gu) +
        countMatches(text, /\p{Script=Katakana}/gu)
      );
    case "Hangul":
      return countMatches(text, /\p{Script=Hangul}/gu);
  }
}

export function matchesLanguageEntry(
  entry: OcrLanguageRegistryEntry,
  text: string
) {
  return evaluateLanguageEntrySignal(entry, text).matched;
}

export function evaluateLanguageEntrySignal(
  entry: OcrLanguageRegistryEntry,
  text: string
) {
  const scriptCount = entry.scripts.reduce(
    (sum, script) => sum + countScript(text, script),
    0
  );
  const requiredCount = entry.requiredAnyScripts.reduce(
    (sum, script) => sum + countScript(text, script),
    0
  );
  const excludedCount = (entry.excludedScripts ?? []).reduce(
    (sum, script) => sum + countScript(text, script),
    0
  );
  const totalCount =
    countScript(text, "Han") +
    countScript(text, "Latin") +
    countScript(text, "Kana") +
    countScript(text, "Hangul");

  if (totalCount < 2) {
    return { matched: false, reason: "字符信号不足" };
  }

  if (requiredCount === 0) {
    return { matched: false, reason: "缺少必要字符信号" };
  }

  if (excludedCount > 0) {
    return { matched: false, reason: "包含排除字符信号" };
  }

  if (scriptCount < entry.minScriptCharacters) {
    return { matched: false, reason: "匹配字符数量不足" };
  }

  const scriptShare = scriptCount / totalCount;
  return scriptShare >= entry.minScriptShare
    ? { matched: true, reason: "字符脚本匹配" }
    : { matched: false, reason: "匹配字符占比不足" };
}
