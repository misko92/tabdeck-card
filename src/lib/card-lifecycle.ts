import type { HomeAssistant, LovelaceCardConfig } from "../types";

export type CreateCardElement = (config: LovelaceCardConfig) => any;

export async function getCreateCardElement(): Promise<CreateCardElement> {
  const helpers = await (window as any).loadCardHelpers();
  return (config: LovelaceCardConfig) => helpers.createCardElement(config);
}

export class CardManager extends EventTarget {
  private _create: CreateCardElement;
  private _configs: (LovelaceCardConfig | null)[] = [];
  private _elements: any[] = [];
  private _hass?: HomeAssistant;
  // When true, elements are created on first get() instead of up front.
  private _lazy = false;

  constructor(create: CreateCardElement) {
    super();
    this._create = create;
  }

  // A `null` config reserves the slot without building a card (e.g. action
  // tabs), keeping indices aligned with the tab list.
  async build(configs: (LovelaceCardConfig | null)[], lazy = false): Promise<void> {
    this._configs = configs.slice();
    this._lazy = lazy;
    this._elements = lazy ? [] : configs.map((cfg, index) => this._make(cfg, index));
  }

  private _make(config: LovelaceCardConfig | null, index: number): any {
    if (!config) return undefined;
    const el = this._create(config);
    if (this._hass) el.hass = this._hass;
    el.addEventListener("ll-rebuild", (e: Event) => {
      e.stopPropagation();
      void this._rebuild(index);
    });
    return el;
  }

  get(index: number): any | undefined {
    if (this._lazy && this._elements[index] === undefined && this._configs[index]) {
      this._elements[index] = this._make(this._configs[index], index);
    }
    return this._elements[index];
  }

  all(): any[] {
    return this._elements;
  }

  setHass(hass: HomeAssistant): void {
    this._hass = hass;
    for (const el of this._elements) if (el) el.hass = hass;
  }

  notifyVisible(index: number): void {
    const el = this._elements[index];
    if (el) el.dispatchEvent(new Event("resize"));
  }

  private async _rebuild(index: number): Promise<void> {
    const fresh = this._make(this._configs[index], index);
    if (!fresh) return;
    if (this._hass) fresh.hass = this._hass;
    this._elements[index] = fresh;
    this.dispatchEvent(new CustomEvent("ll-rebuild-done", { detail: { index } }));
  }
}
