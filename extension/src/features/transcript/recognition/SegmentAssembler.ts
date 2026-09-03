import type { TranscriptSegment } from "../model";

const ACTIVE_TEXT_THRESHOLD = 0.72;
const CANDIDATE_TEXT_THRESHOLD = 0.68;
const MAX_SAMPLE_GAP_SECONDS = 2.6;
const MIN_CONFIRMATIONS = 2;

type SubtitleCandidate = {
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  samples: number;
  text: string;
};

function normalizedForComparison(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function levenshteinDistance(left: string, right: string) {
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function similarity(left: string, right: string) {
  const normalizedLeft = normalizedForComparison(left);
  const normalizedRight = normalizedForComparison(right);
  const longest = Math.max(normalizedLeft.length, normalizedRight.length);

  if (longest === 0) return 1;
  return 1 - levenshteinDistance(normalizedLeft, normalizedRight) / longest;
}

export function cleanOcrText(text: string) {
  return text
    .normalize("NFKC")
    .split(/\r?\n/u)
    .map((line) =>
      line
        .replace(
          /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu,
          "$1"
        )
        .replace(/\s+/gu, " ")
        .trim()
    )
    .filter((line) => normalizedForComparison(line).length >= 2)
    .join("\n")
    .trim();
}

export class SegmentAssembler {
  #candidate: SubtitleCandidate | null = null;
  #segments: TranscriptSegment[] = [];

  get segments() {
    return this.#segments;
  }

  clear() {
    this.#candidate = null;
    this.#segments = [];
  }

  addSample(videoTime: number, rawText: string, confidence: number) {
    const text = cleanOcrText(rawText);
    if (!text) {
      return this.#segments;
    }

    const active = this.#segments.at(-1);
    const continuesActive =
      active &&
      videoTime - active.end <= MAX_SAMPLE_GAP_SECONDS &&
      similarity(active.text, text) >= ACTIVE_TEXT_THRESHOLD;

    if (continuesActive) {
      const updated: TranscriptSegment = {
        ...active,
        confidence: Math.max(active.confidence, confidence),
        end: Math.max(active.end, videoTime + 0.3),
        samples: active.samples + 1,
        text: confidence > active.confidence ? text : active.text
      };
      this.#segments = [...this.#segments.slice(0, -1), updated];
      this.#candidate = null;
      return this.#segments;
    }

    const continuesCandidate =
      this.#candidate &&
      videoTime - this.#candidate.lastSeen <= MAX_SAMPLE_GAP_SECONDS &&
      similarity(this.#candidate.text, text) >= CANDIDATE_TEXT_THRESHOLD;

    if (continuesCandidate && this.#candidate) {
      this.#candidate = {
        ...this.#candidate,
        confidence: Math.max(this.#candidate.confidence, confidence),
        lastSeen: videoTime,
        samples: this.#candidate.samples + 1,
        text:
          confidence > this.#candidate.confidence
            ? text
            : this.#candidate.text
      };
    } else {
      this.#candidate = {
        confidence,
        firstSeen: videoTime,
        lastSeen: videoTime,
        samples: 1,
        text
      };
    }

    if (this.#candidate.samples < MIN_CONFIRMATIONS) {
      return this.#segments;
    }

    const confirmed = this.#candidate;
    this.#candidate = null;

    const closedSegments = active
      ? [
          ...this.#segments.slice(0, -1),
          {
            ...active,
            end: Math.max(active.start + 0.3, confirmed.firstSeen)
          }
        ]
      : this.#segments;

    this.#segments = [
      ...closedSegments,
      {
        confidence: confirmed.confidence,
        end: confirmed.lastSeen + 0.3,
        id: `${Math.round(confirmed.firstSeen * 1000)}-${crypto.randomUUID()}`,
        samples: confirmed.samples,
        start: confirmed.firstSeen,
        text: confirmed.text
      }
    ];

    return this.#segments;
  }
}
