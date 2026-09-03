import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import styles from "./styles.css?inline";
import { APPEARANCE } from "../config/appearance";
import { findBilibiliPlayer } from "../sites/bilibili";
import { App } from "./App";

const ROOT_ATTRIBUTE = "data-justlisten-root";

let currentPlayer: HTMLElement | null = null;
let currentHost: HTMLElement | null = null;
let reactRoot: Root | null = null;
let syncFrame = 0;

function unmount() {
  reactRoot?.unmount();
  currentHost?.remove();
  reactRoot = null;
  currentHost = null;
  currentPlayer = null;
}

function mount(player: HTMLElement) {
  const existingHost = player.querySelector<HTMLElement>(`[${ROOT_ATTRIBUTE}]`);
  if (existingHost) {
    existingHost.remove();
  }

  const host = document.createElement("div");
  host.setAttribute(ROOT_ATTRIBUTE, "");
  host.style.setProperty("display", "contents", "important");

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;

  const appRoot = document.createElement("div");
  appRoot.style.setProperty(
    "--jl-bookmark-idle-opacity",
    String(APPEARANCE.bookmarkIdleOpacity)
  );
  appRoot.style.setProperty("--jl-mask-blur", `${APPEARANCE.maskBlurPx}px`);
  appRoot.style.setProperty("--jl-mask-tint", String(APPEARANCE.maskTint));
  appRoot.style.setProperty(
    "--jl-mask-saturation",
    `${APPEARANCE.maskSaturationPercent}%`
  );

  shadowRoot.append(style, appRoot);
  player.append(host);

  currentPlayer = player;
  currentHost = host;
  reactRoot = createRoot(appRoot);
  reactRoot.render(
    <StrictMode>
      <App player={player} />
    </StrictMode>
  );
}

function syncMount() {
  syncFrame = 0;
  const player = findBilibiliPlayer();

  if (!player) {
    if (currentPlayer && !currentPlayer.isConnected) {
      unmount();
    }
    return;
  }

  if (
    player === currentPlayer &&
    currentHost?.isConnected &&
    player.contains(currentHost)
  ) {
    return;
  }

  unmount();
  mount(player);
}

function scheduleSync() {
  if (syncFrame) {
    return;
  }

  syncFrame = window.requestAnimationFrame(syncMount);
}

const observer = new MutationObserver(scheduleSync);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

document.addEventListener("fullscreenchange", scheduleSync);
window.addEventListener("pageshow", scheduleSync);
scheduleSync();
