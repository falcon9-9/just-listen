import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { NormalizedRect } from "../model/mask";

type InteractionMode =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

type FrostedMaskProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rect: NormalizedRect;
  revealing: boolean;
  onChange: (rect: NormalizedRect) => void;
};

type DragState = {
  mode: InteractionMode;
  pointerId: number;
  startX: number;
  startY: number;
  containerWidth: number;
  containerHeight: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const MIN_WIDTH_PX = 80;
const MIN_HEIGHT_PX = 52;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function DragIcon() {
  const dots = [
    [9, 6],
    [15, 6],
    [9, 12],
    [15, 12],
    [9, 18],
    [15, 18]
  ];

  return (
    <svg
      aria-hidden="true"
      className="jl-mask__drag-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      {dots.map(([cx, cy]) => (
        <circle cx={cx} cy={cy} fill="currentColor" key={`${cx}-${cy}`} r="1.3" />
      ))}
    </svg>
  );
}

export function FrostedMask({
  containerRef,
  rect,
  revealing,
  onChange
}: FrostedMaskProps) {
  const dragState = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);

  function beginInteraction(
    event: ReactPointerEvent<HTMLElement>,
    mode: InteractionMode
  ) {
    if (event.button !== 0) {
      return;
    }

    const container = containerRef.current?.getBoundingClientRect();
    if (!container || container.width <= 0 || container.height <= 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const left = rect.x * container.width;
    const top = rect.y * container.height;

    dragState.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      containerWidth: container.width,
      containerHeight: container.height,
      left,
      top,
      right: left + rect.width * container.width,
      bottom: top + rect.height * container.height
    };
    setDragging(true);
  }

  function updateInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    let { left, top, right, bottom } = drag;

    if (drag.mode === "move") {
      const width = right - left;
      const height = bottom - top;
      left = clamp(left + deltaX, 0, drag.containerWidth - width);
      top = clamp(top + deltaY, 0, drag.containerHeight - height);
      right = left + width;
      bottom = top + height;
    } else {
      if (drag.mode.includes("w")) {
        left = clamp(left + deltaX, 0, right - MIN_WIDTH_PX);
      }
      if (drag.mode.includes("e")) {
        right = clamp(right + deltaX, left + MIN_WIDTH_PX, drag.containerWidth);
      }
      if (drag.mode.includes("n")) {
        top = clamp(top + deltaY, 0, bottom - MIN_HEIGHT_PX);
      }
      if (drag.mode.includes("s")) {
        bottom = clamp(bottom + deltaY, top + MIN_HEIGHT_PX, drag.containerHeight);
      }
    }

    onChange({
      x: left / drag.containerWidth,
      y: top / drag.containerHeight,
      width: (right - left) / drag.containerWidth,
      height: (bottom - top) / drag.containerHeight
    });
  }

  function endInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragState.current = null;
    setDragging(false);
  }

  const maskStyle = {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`
  };

  const handles: Array<{ mode: InteractionMode; className: string }> = [
    { mode: "n", className: "jl-mask__edge jl-mask__edge--n" },
    { mode: "s", className: "jl-mask__edge jl-mask__edge--s" },
    { mode: "w", className: "jl-mask__edge jl-mask__edge--w" },
    { mode: "e", className: "jl-mask__edge jl-mask__edge--e" },
    { mode: "nw", className: "jl-mask__grip jl-mask__grip--nw" },
    { mode: "ne", className: "jl-mask__grip jl-mask__grip--ne" },
    { mode: "sw", className: "jl-mask__grip jl-mask__grip--sw" },
    { mode: "se", className: "jl-mask__grip jl-mask__grip--se" }
  ];

  return (
    <div
      aria-label="字幕遮罩"
      className="jl-mask"
      data-dragging={dragging || undefined}
      data-revealing={revealing || undefined}
      onPointerCancel={endInteraction}
      onPointerDown={(event) => beginInteraction(event, "move")}
      onPointerMove={updateInteraction}
      onPointerUp={endInteraction}
      role="group"
      style={maskStyle}
    >
      <div className="jl-mask__hint">
        <DragIcon />
        拖动到字幕上
      </div>
      {handles.map(({ mode, className }) => (
        <span
          aria-hidden="true"
          className={className}
          key={mode}
          onPointerDown={(event) => beginInteraction(event, mode)}
        />
      ))}
    </div>
  );
}
