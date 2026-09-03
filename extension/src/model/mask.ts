export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_MASK_RECT: NormalizedRect = {
  x: 0.19,
  y: 0.76,
  width: 0.62,
  height: 0.18
};

export function isNormalizedRect(value: unknown): value is NormalizedRect {
  if (!value || typeof value !== "object") {
    return false;
  }

  const rect = value as Partial<NormalizedRect>;
  const values = [rect.x, rect.y, rect.width, rect.height];

  return (
    values.every((item) => typeof item === "number" && Number.isFinite(item)) &&
    rect.x! >= 0 &&
    rect.y! >= 0 &&
    rect.width! > 0 &&
    rect.height! > 0 &&
    rect.x! + rect.width! <= 1.001 &&
    rect.y! + rect.height! <= 1.001
  );
}

