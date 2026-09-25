export class Manager<T> {
  private items: Map<string, T>;

  constructor() {
    this.items = new Map<string, T>();
  }

  get count(): number {
    return this.items.size;
  }

  add(name: string, item: T): T {
    if (this.items.has(name)) {
      throw new Error(`Manager: "${name}" already added`);
    }
    this.items.set(name, item);
    return item;
  }

  find(name: string): T | undefined {
    return this.items.get(name);
  }

  remove(name: string): boolean {
    return this.items.delete(name);
  }

  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.items.values();
  }
}
