// Simplified image resize module compatible with Quill 2 (no toolbar, resize handles only)
// Based on quill-image-resize-module-ts with ESM-safe imports.
import Quill from "quill";

type StyleMap = Partial<Record<keyof CSSStyleDeclaration, string>>;
type ResizeModuleName = "Resize" | "DisplaySize";
type ImageResizeOptions = {
  overlayStyles?: StyleMap;
  handleStyles?: StyleMap;
  displayStyles?: StyleMap;
  modules?: Array<ResizeModuleName | ModuleClass>;
};

type NullableRange = { index: number; length: number } | null;

type ModuleClass = new (resize: ImageResize) => BaseModule;

const DEFAULT_OPTIONS: Required<ImageResizeOptions> = {
  overlayStyles: {
    position: "absolute",
    boxSizing: "border-box",
    border: "1px solid #777",
  },
  handleStyles: {
    position: "absolute",
    height: "12px",
    width: "12px",
    background: "white",
    border: "1px solid #777",
    boxSizing: "border-box",
  },
  displayStyles: {
    position: "absolute",
    font: "12px/1.0 Arial, Helvetica, sans-serif",
    padding: "4px 8px",
    textAlign: "center",
    background: "white",
    color: "#333",
    border: "1px solid #777",
    boxSizing: "border-box",
  },
  modules: ["Resize", "DisplaySize"],
};

export default class ImageResize {
  private quill: Quill;
  private options: Required<ImageResizeOptions>;
  private overlay?: HTMLDivElement;
  private img?: HTMLImageElement;
  private modules: BaseModule[] = [];
  private moduleClasses: ModuleClass[];
  private listeners: { onClick: (e: Event) => void; onKeyUp: (e: Event) => void };

  constructor(quill: Quill, options: ImageResizeOptions = {}) {
    this.quill = quill;
    this.options = {
      overlayStyles: { ...DEFAULT_OPTIONS.overlayStyles, ...(options.overlayStyles || {}) },
      handleStyles: { ...DEFAULT_OPTIONS.handleStyles, ...(options.handleStyles || {}) },
      displayStyles: { ...DEFAULT_OPTIONS.displayStyles, ...(options.displayStyles || {}) },
      modules: options.modules || DEFAULT_OPTIONS.modules,
    };

    this.moduleClasses = (this.options.modules || []).map((m) => {
      if (m === "Resize") return Resize as unknown as ModuleClass;
      if (m === "DisplaySize") return DisplaySize as unknown as ModuleClass;
      return m;
    });

    this.listeners = {
      onClick: this.handleClick.bind(this),
      onKeyUp: this.checkImage.bind(this),
    };

    document.execCommand("enableObjectResizing", false, "false");
    this.quill.root.addEventListener("click", this.listeners.onClick, false);
    const parentNode = this.quill.root.parentNode as HTMLElement | null;
    if (parentNode) {
      parentNode.style.position = parentNode.style.position || "relative";
    }
  }

  private handleClick(evt: Event) {
    const target = evt.target as HTMLElement;
    if (target?.tagName?.toUpperCase() === "IMG") {
      if (this.img === target) return;
      if (this.img) this.hide();
      this.show(target as HTMLImageElement);
    } else if (this.img) {
      this.hide();
    }
  }

  private show(img: HTMLImageElement) {
    this.img = img;
    this.showOverlay();
    this.initModules();
  }

  private showOverlay() {
    if (this.overlay) this.hideOverlay();
    this.quill.setSelection(null as unknown as NullableRange);
    this.setUserSelect("none");
    document.addEventListener("keyup", this.listeners.onKeyUp, true);
    this.quill.root.addEventListener("input", this.listeners.onKeyUp, true);
    const parentNode = this.quill.root.parentNode as HTMLElement | null;
    if (!parentNode) return;
    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, this.options.overlayStyles);
    parentNode.appendChild(this.overlay);
    this.reposition();
  }

  private hideOverlay() {
    if (!this.overlay) return;
    const parentNode = this.quill.root.parentNode as HTMLElement | null;
    if (parentNode) {
      parentNode.removeChild(this.overlay);
    }
    this.overlay = undefined;
    document.removeEventListener("keyup", this.listeners.onKeyUp);
    this.quill.root.removeEventListener("input", this.listeners.onKeyUp);
    this.setUserSelect("");
  }

  private initModules() {
    this.removeModules();
    this.modules = this.moduleClasses.map((ModuleClass) => new ModuleClass(this));
    this.modules.forEach((mod) => mod.onCreate());
    this.onUpdate();
  }

  private removeModules() {
    this.modules.forEach((mod) => mod.onDestroy());
    this.modules = [];
  }

  private checkImage(evt: Event) {
    if (!(evt instanceof KeyboardEvent)) return;
    if (!this.img) return;
    const KEY_BACKSPACE = 8;
    const KEY_DELETE = 46;
    if (evt.keyCode === KEY_BACKSPACE || evt.keyCode === KEY_DELETE) {
      const blot = Quill.find(this.img);
      if (blot && typeof (blot as { deleteAt?: (index: number, length?: number) => void }).deleteAt === "function") {
        (blot as { deleteAt: (index: number, length?: number) => void }).deleteAt(0);
      }
      this.hide();
    }
  }

  private setUserSelect(value: string) {
    ["userSelect", "mozUserSelect", "webkitUserSelect", "msUserSelect"].forEach((prop) => {
      (this.quill.root.style as unknown as Record<string, string>)[prop] = value;
      (document.documentElement.style as unknown as Record<string, string>)[prop] = value;
    });
  }

  private reposition() {
    if (!this.overlay || !this.img) return;
    const parent = this.quill.root.parentNode as HTMLElement | null;
    if (!parent) return;
    const imgRect = this.img.getBoundingClientRect();
    const containerRect = parent.getBoundingClientRect();
    Object.assign(this.overlay.style, {
      left: `${imgRect.left - containerRect.left - 1 + parent.scrollLeft}px`,
      top: `${imgRect.top - containerRect.top + parent.scrollTop}px`,
      width: `${imgRect.width}px`,
      height: `${imgRect.height}px`,
    });
  }

  private hide() {
    this.hideOverlay();
    this.removeModules();
    this.img = undefined;
  }

  onUpdate() {
    this.reposition();
    this.modules.forEach((mod) => mod.onUpdate());
  }

  get overlayElement() {
    return this.overlay;
  }
  get image() {
    return this.img;
  }
  get handleStyles() {
    return this.options.handleStyles;
  }
  get displayStyles() {
    return this.options.displayStyles;
  }
  get moduleOptions() {
    return this.options;
  }
}

abstract class BaseModule {
  protected overlay?: HTMLDivElement;
  protected img?: HTMLImageElement;
  protected options: Required<ImageResizeOptions>;
  protected resizer: ImageResize;

  constructor(resizer: ImageResize) {
    this.resizer = resizer;
    this.overlay = resizer.overlayElement;
    this.img = resizer.image;
    this.options = resizer.moduleOptions;
  }

  abstract onCreate(): void;
  abstract onDestroy(): void;
  abstract onUpdate(): void;
}

class Resize extends BaseModule {
  private boxes: HTMLDivElement[] = [];
  private currentBox?: HTMLDivElement;
  private dragStartX = 0;
  private startWidth = 0;
  private listeners: { onMouseMove: (e: MouseEvent) => void; onMouseUp: (e: MouseEvent) => void };

  constructor(resizer: ImageResize) {
    super(resizer);
    this.listeners = {
      onMouseMove: this.onMouseMove.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
    };
  }

  onCreate() {
    if (!this.overlay) return;
    this.boxes = [
      this.createBox("nwse-resize"),
      this.createBox("nesw-resize"),
      this.createBox("nwse-resize"),
      this.createBox("nesw-resize"),
    ];
    this.positionBoxes();
  }

  onDestroy() {
    document.removeEventListener("mousemove", this.listeners.onMouseMove);
    document.removeEventListener("mouseup", this.listeners.onMouseUp);
  }

  onUpdate() {
    this.positionBoxes();
  }

  private createBox(cursor: string) {
    const box = document.createElement("div");
    Object.assign(box.style, this.options.handleStyles);
    box.style.cursor = cursor;
    box.style.width = this.options.handleStyles.width || `${DEFAULT_OPTIONS.handleStyles.width}`;
    box.style.height = this.options.handleStyles.height || `${DEFAULT_OPTIONS.handleStyles.height}`;
    box.addEventListener("mousedown", (e) => this.onMouseDown(e, box), false);
    this.overlay?.appendChild(box);
    return box;
  }

  private positionBoxes() {
    if (!this.overlay || this.boxes.length === 0) return;
    const w = parseFloat(this.options.handleStyles.width || `${DEFAULT_OPTIONS.handleStyles.width}`);
    const h = parseFloat(this.options.handleStyles.height || `${DEFAULT_OPTIONS.handleStyles.height}`);
    const x = `${-w / 2}px`;
    const y = `${-h / 2}px`;
    this.boxes[0].style.left = x;
    this.boxes[0].style.top = y;
    this.boxes[1].style.right = x;
    this.boxes[1].style.top = y;
    this.boxes[2].style.right = x;
    this.boxes[2].style.bottom = y;
    this.boxes[3].style.left = x;
    this.boxes[3].style.bottom = y;
  }

  private onMouseDown(evt: MouseEvent, box: HTMLDivElement) {
    if (!this.img) return;
    this.currentBox = box;
    this.dragStartX = evt.clientX;
    this.startWidth = this.img.width || this.img.naturalWidth;
    document.addEventListener("mousemove", this.listeners.onMouseMove);
    document.addEventListener("mouseup", this.listeners.onMouseUp);
    evt.preventDefault();
  }

  private onMouseMove(evt: MouseEvent) {
    if (!this.img || !this.currentBox) return;
    const deltaX = evt.clientX - this.dragStartX;
    if (this.currentBox === this.boxes[0] || this.currentBox === this.boxes[3]) {
      this.img.width = Math.round(this.startWidth - deltaX);
    } else {
      this.img.width = Math.round(this.startWidth + deltaX);
    }
    this.resizer.onUpdate();
  }

  private onMouseUp() {
    document.removeEventListener("mousemove", this.listeners.onMouseMove);
    document.removeEventListener("mouseup", this.listeners.onMouseUp);
    this.currentBox = undefined;
  }
}

class DisplaySize extends BaseModule {
  private label?: HTMLDivElement;

  onCreate() {
    if (!this.overlay) return;
    this.label = document.createElement("div");
    Object.assign(this.label.style, this.options.displayStyles);
    this.overlay.appendChild(this.label);
  }

  onDestroy() {}

  onUpdate() {
    if (!this.label || !this.img) return;
    const width = this.img.width;
    const height = Math.round((this.img.width / this.img.naturalWidth) * this.img.naturalHeight);
    this.label.innerHTML = `${width} × ${height}`;
    this.label.style.right = "4px";
    this.label.style.bottom = "4px";
  }
}
