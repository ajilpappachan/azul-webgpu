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
    // TODO
    throw Error();
  }

  getNumSiblings(): number {
    // TODO
    throw Error();
  }

  getLevel(): number {
    // TODO
    throw Error();
  }
}
