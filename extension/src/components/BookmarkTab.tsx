import { useRef, type PointerEvent as ReactPointerEvent } from "react";

type BookmarkTabProps = {
  active: boolean;
  revealing: boolean;
  onRevealChange: (revealing: boolean) => void;
  onToggle: () => void;
};

const HOLD_DELAY_MS = 180;

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="jl-bookmark__icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
      <path d="M9.9 4.3A10.6 10.6 0 0 1 12 4c5.4 0 9 5.2 9 5.2a14.8 14.8 0 0 1-2.2 2.7" />
      <path d="M6.6 6.6A15.7 15.7 0 0 0 3 9.2S6.6 14.4 12 14.4c1 0 2-.2 2.8-.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="jl-bookmark__icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M3 12s3.6-5.2 9-5.2S21 12 21 12s-3.6 5.2-9 5.2S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function BookmarkTab({
  active,
  revealing,
  onRevealChange,
  onToggle
}: BookmarkTabProps) {
  const holdTimer = useRef<number | null>(null);
  const heldToReveal = useRef(false);

  function clearHoldTimer() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function beginHold(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!active || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    heldToReveal.current = false;
    clearHoldTimer();
    holdTimer.current = window.setTimeout(() => {
      heldToReveal.current = true;
      onRevealChange(true);
    }, HOLD_DELAY_MS);
  }

  function endHold() {
    clearHoldTimer();
    onRevealChange(false);
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (heldToReveal.current) {
      event.preventDefault();
      event.stopPropagation();
      heldToReveal.current = false;
      return;
    }

    onToggle();
  }

  return (
    <div
      className="jl-bookmark"
      data-active={active || undefined}
      data-revealing={revealing || undefined}
    >
      <button
        aria-label={active ? "关闭字幕遮罩" : "开启字幕遮罩"}
        aria-pressed={active}
        className="jl-bookmark__button"
        onClick={handleClick}
        onPointerCancel={endHold}
        onPointerDown={beginHold}
        onPointerUp={endHold}
        type="button"
      >
        {active ? <EyeOffIcon /> : <EyeIcon />}
        <span className="jl-bookmark__tooltip">
          {active ? "别看字 · 按住临时显示" : "别看字"}
        </span>
      </button>
    </div>
  );
}
