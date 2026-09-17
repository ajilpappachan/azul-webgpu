import { describe, it, expect, beforeEach } from "vitest";
import { PCSNode } from "@azul/pcs";

function link(parent: PCSNode, ...children: PCSNode[]) {
  parent.child = children[0] ?? null;
  children.forEach((c, i) => {
    c.parent = parent;
    c.prevSibling = children[i - 1] ?? null;
    c.nextSibling = children[i + 1] ?? null;
  });
}

describe("PCSNode", () => {
  // Root
  //   -> A
  //     -> D
  //     -> E
  //   -> B
  //   -> C
  let root: PCSNode, a: PCSNode, b: PCSNode, c: PCSNode, d: PCSNode, e: PCSNode;

  beforeEach(() => {
    root = new PCSNode("Root");
    a = new PCSNode("A");
    b = new PCSNode("B");
    c = new PCSNode("C");
    d = new PCSNode("D");
    e = new PCSNode("E");

    link(root, a, b, c);
    link(a, d, e);
  });

  it("starts unlinked with name", () => {
    const n = new PCSNode("Test");
    expect(n.name).toBe("Test");
    expect(n.parent).toBeNull();
    expect(n.child).toBeNull();
    expect(n.nextSibling).toBeNull();
    expect(n.prevSibling).toBeNull();
  });

  it("counts children", () => {
    expect(root.getNumChildren()).toBe(3);
    expect(a.getNumChildren()).toBe(2);
    expect(b.getNumChildren()).toBe(0);
  });

  it("counts siblings including itself", () => {
    expect(a.getNumSiblings()).toBe(3);
    expect(b.getNumSiblings()).toBe(3);
    expect(c.getNumSiblings()).toBe(3);
    expect(e.getNumSiblings()).toBe(2);
    expect(root.getNumSiblings()).toBe(1);
  });

  it("reports level with root at level 0", () => {
    expect(root.getDepth()).toBe(0);
    expect(b.getDepth()).toBe(1);
    expect(d.getDepth()).toBe(2);
  });
});
