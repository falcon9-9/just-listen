export type NormalizedCaptureRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const HARD_SUBTITLE_REGION: NormalizedCaptureRegion = {
  x: 0.04,
  y: 0.65,
  width: 0.92,
  height: 0.35
};

const MAX_CAPTURE_WIDTH = 1280;

export class VideoFrameSource {
  readonly #canvas = document.createElement("canvas");
  readonly #context: CanvasRenderingContext2D;

  constructor(
    readonly region: NormalizedCaptureRegion = HARD_SUBTITLE_REGION
  ) {
    const context = this.#canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true
    });

    if (!context) {
      throw new Error("当前浏览器无法创建 OCR Canvas。请重新加载页面后再试。");
    }

    this.#context = context;
  }

  capture(video: HTMLVideoElement): HTMLCanvasElement {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      throw new Error("视频画面尚未准备好。");
    }

    const sourceWidth = Math.round(video.videoWidth * this.region.width);
    const sourceHeight = Math.round(video.videoHeight * this.region.height);
    const sourceX = Math.round(video.videoWidth * this.region.x);
    const sourceY = Math.round(video.videoHeight * this.region.y);

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error("无法读取当前视频尺寸。");
    }

    const scale = Math.min(1, MAX_CAPTURE_WIDTH / sourceWidth);
    this.#canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    this.#canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    this.#context.save();
    this.#context.imageSmoothingEnabled = true;
    this.#context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      this.#canvas.width,
      this.#canvas.height
    );
    this.#context.restore();

    try {
      this.#context.getImageData(0, 0, 1, 1);
    } catch {
      throw new Error(
        "浏览器阻止读取视频像素。该页面的视频资源受到跨域保护。"
      );
    }

    return this.#canvas;
  }
}
