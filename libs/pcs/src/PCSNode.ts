export class PCSNode {
  name: string;
  parent: PCSNode | null = null;
  child: PCSNode | null = null;
  nextSibling: PCSNode | null = null;
  prevSibling: PCSNode | null = null;

  constructor(name: string) {
    this.name = name;
  }

  getNumChildren(): number {
    let num: number = 0;
    let node: PCSNode | null = this.child;
    while (node !== null) {
      num++;
      node = node.nextSibling;
    }
    return num;
  }

  getNumSiblings(): number {
    // Go to first sibling
    let node: PCSNode | null = this;
    while (node.prevSibling !== null) {
      node = node.prevSibling;
    }
    let num: number = 0;
    while (node !== null) {
      num++;
      node = node.nextSibling;
    }
    return num;
  }

  getDepth(): number {
    // Go to root
    let node: PCSNode | null = this.parent;
    let depth: number = 0;
    while (node !== null) {
      depth++;
      node = node.parent;
    }
    return depth;
  }
}
