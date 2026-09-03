const PLAYER_SELECTORS = [
  ".bpx-player-container",
  "#bilibili-player",
  ".bilibili-player"
] as const;

function matchesPlayer(element: Element): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    PLAYER_SELECTORS.some((selector) => element.matches(selector))
  );
}

function findWithin(scope: ParentNode): HTMLElement | null {
  if (scope instanceof Element && matchesPlayer(scope)) {
    return scope;
  }

  for (const selector of PLAYER_SELECTORS) {
    const player = scope.querySelector<HTMLElement>(selector);
    if (player) {
      return player;
    }
  }

  return null;
}

export function findBilibiliPlayer(): HTMLElement | null {
  const fullscreenPlayer = document.fullscreenElement
    ? findWithin(document.fullscreenElement)
    : null;

  return fullscreenPlayer ?? findWithin(document);
}

