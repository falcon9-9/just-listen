import assert from "node:assert/strict";
import { LanguageRouter } from "../src/features/transcript/recognition/LanguageRouter.ts";
import { OCR_LANGUAGE_REGISTRY } from "../src/features/transcript/recognition/languageRegistry.ts";

function frame(text: string, confidence = 86) {
  return {
    confidence,
    detectedBoxes: text ? 1 : 0,
    recognizedCount: text ? 1 : 0,
    selectedCount: text ? 1 : 0,
    text
  };
}

const cjkModelKeys = OCR_LANGUAGE_REGISTRY.slice(0, 3).map(
  (entry) => entry.modelKey
);
assert.deepEqual(
  OCR_LANGUAGE_REGISTRY.map((entry) => entry.language),
  ["zh", "en", "ja", "ko"]
);
assert.equal(new Set(cjkModelKeys).size, 1);

async function main() {
  const router = new LanguageRouter();
  const seen: string[] = [];
  const result = await router.route(OCR_LANGUAGE_REGISTRY, async (entry) => {
    seen.push(entry.language);
    return frame("hello world");
  });

  assert.equal(result.language, "en");
  assert.equal(result.lockedLanguage, null);
  assert.deepEqual(seen, ["zh", "en"]);

  {
    const router = new LanguageRouter();
    const frameCache = new Map<string, ReturnType<typeof frame>>();
    const modelCalls = new Map<string, number>();
    const result = await router.route(OCR_LANGUAGE_REGISTRY, async (entry) => {
      if (!frameCache.has(entry.modelKey)) {
        modelCalls.set(entry.modelKey, (modelCalls.get(entry.modelKey) ?? 0) + 1);
        frameCache.set(entry.modelKey, frame("hello world"));
      }

      return frameCache.get(entry.modelKey) ?? null;
    });

    assert.equal(result.language, "en");
    assert.equal(modelCalls.get("pp-ocrv5-cjk"), 1);
  }

  {
    const router = new LanguageRouter();
    await router.route(OCR_LANGUAGE_REGISTRY, async () => frame("你好世界"));
    await router.route(OCR_LANGUAGE_REGISTRY, async () => frame("你好世界"));
    const seenAfterLock: string[] = [];
    const result = await router.route(OCR_LANGUAGE_REGISTRY, async () =>
      frame("你好世界")
    );
    const lockedResult = await router.route(OCR_LANGUAGE_REGISTRY, async (entry) => {
      seenAfterLock.push(entry.language);
      return frame("你好世界");
    });

    assert.equal(result.language, "zh");
    assert.equal(result.lockedLanguage, "zh");
    assert.equal(lockedResult.lockedLanguage, "zh");
    assert.deepEqual(seenAfterLock, ["zh"]);
  }

  {
    const router = new LanguageRouter();
    const first = await router.route(OCR_LANGUAGE_REGISTRY, async () =>
      frame("今日は")
    );
    const second = await router.route(OCR_LANGUAGE_REGISTRY, async () =>
      frame("今日は")
    );

    assert.equal(first.language, "ja");
    assert.equal(first.lockedLanguage, null);
    assert.equal(second.lockedLanguage, "ja");
  }

  {
    const router = new LanguageRouter();
    const result = await router.route(OCR_LANGUAGE_REGISTRY, async (entry) => {
      return entry.model.status === "unavailable" ? null : frame("한국어");
    });
    const korean = result.route.evaluations.find(
      (entry) => entry.language === "ko"
    );

    assert.equal(result.text, "");
    assert.equal(korean?.status, "unavailable");
  }
}

void main().then(() => {
  console.log("language router verification passed");
});
