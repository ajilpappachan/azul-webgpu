export class Keyboard {
  private down: Set<string>;

  constructor(target: Window) {
    this.down = new Set<string>();
    target.addEventListener("keydown", (e: KeyboardEvent) => this.onKeyDown(e));
    target.addEventListener("keyup", (e: KeyboardEvent) => this.onKeyUp(e));
    target.addEventListener("blur", () => this.down.clear());
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement) {
      return;
    }
    this.down.add(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.down.delete(e.code);
  }
}
