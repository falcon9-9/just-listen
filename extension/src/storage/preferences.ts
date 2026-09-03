import {
  DEFAULT_MASK_RECT,
  isNormalizedRect,
  type NormalizedRect
} from "../model/mask";

const STORAGE_KEY = "p0Preferences";

export type P0Preferences = {
  maskEnabled: boolean;
  maskRect: NormalizedRect;
};

export const DEFAULT_PREFERENCES: P0Preferences = {
  maskEnabled: false,
  maskRect: DEFAULT_MASK_RECT
};

function canUseExtensionStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function loadPreferences(): Promise<P0Preferences> {
  if (!canUseExtensionStorage()) {
    return DEFAULT_PREFERENCES;
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<P0Preferences> | undefined;

  return {
    maskEnabled:
      typeof stored?.maskEnabled === "boolean"
        ? stored.maskEnabled
        : DEFAULT_PREFERENCES.maskEnabled,
    maskRect: isNormalizedRect(stored?.maskRect)
      ? stored.maskRect
      : DEFAULT_PREFERENCES.maskRect
  };
}

export async function savePreferences(preferences: P0Preferences) {
  if (!canUseExtensionStorage()) {
    return;
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: preferences
  });
}

