import type { PCSNode } from "./PCSNode";

export class PCSTree {
  root: PCSNode | null;

  constructor() {
    this.root = null;
  }

  insert(node: PCSNode, parent: PCSNode | null): void {
    if (node === this.root) {
      this.root = null;
    }
    this.unlink(node);

    if (parent === null) {
      this.root = node;
      return;
    }

    const firstChild: PCSNode | null = parent.child;

    node.parent = parent;
    node.nextSibling = firstChild;

    if (firstChild !== null) {
      firstChild.prevSibling = node;
    }
    parent.child = node;
  }

  remove(node: PCSNode): void {
    if (node === this.root) {
      this.root = null;
    }
    this.unlink(node);
  }

  getNumNodes(): number {
    let num: number = 0;
    for (const _node of this) {
      num++;
    }
    return num;
  }

  getNumLevels(): number {
    let max: number = -1;
    for (const node of this) {
      const depth: number = node.getDepth();
      if (depth > max) {
        max = depth;
      }
    }
    return max + 1;
  }

  *[Symbol.iterator](): Generator<PCSNode> {
    if (this.root !== null) {
      yield this.root;
      yield* PCSTree.forward(this.root.child);
    }
  }

  *reverse(): Generator<PCSNode> {
    if (this.root !== null) {
      yield* PCSTree.backward(this.root.child);
      yield this.root;
    }
  }

  private static *forward(node: PCSNode | null): Generator<PCSNode> {
    let curr: PCSNode | null = node;
    while (curr !== null) {
      yield curr;
      yield* PCSTree.forward(curr.child);
      curr = curr.nextSibling;
    }
  }

  private static *backward(node: PCSNode | null): Generator<PCSNode> {
    // Go to last sibling
    let curr: PCSNode | null = node;
    while (curr !== null && curr.nextSibling !== null) {
      curr = curr.nextSibling;
    }
    while (curr !== null) {
      yield* PCSTree.backward(curr.child);
      yield curr;
      curr = curr.prevSibling;
    }
  }

  private unlink(node: PCSNode): void {
    const parent: PCSNode | null = node.parent;
    const prev: PCSNode | null = node.prevSibling;
    const next: PCSNode | null = node.nextSibling;

    if (prev !== null) {
      prev.nextSibling = next;
    } else if (parent !== null) {
      parent.child = next;
    }

    if (next !== null) {
      next.prevSibling = prev;
    }

    node.parent = null;
    node.prevSibling = null;
    node.nextSibling = null;
  }
}
