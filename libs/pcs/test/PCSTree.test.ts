import { describe, it, expect, beforeEach } from "vitest";
import { PCSNode, PCSTree } from "@azul/pcs";

function names(nodes: Iterable<PCSNode>): string[] {
  return [...nodes].map((n: PCSNode) => n.name);
}

describe("PCSTree", () => {
  // Root
  //   -> C
  //   -> B
  //   -> A
  //     -> E
  //     -> D
  let tree: PCSTree;
  let root: PCSNode, a: PCSNode, b: PCSNode, c: PCSNode, d: PCSNode, e: PCSNode;

  beforeEach(() => {
    tree = new PCSTree();
    root = new PCSNode("Root");
    a = new PCSNode("A");
    b = new PCSNode("B");
    c = new PCSNode("C");
    d = new PCSNode("D");
    e = new PCSNode("E");

    tree.insert(root, null);
    tree.insert(a, root);
    tree.insert(b, root);
    tree.insert(c, root);
    tree.insert(d, a);
    tree.insert(e, a);
  });

  it("is empty before any insert", () => {
    const empty = new PCSTree();
    expect(empty.root).toBeNull();
    expect(empty.getNumNodes()).toBe(0);
    expect(empty.getNumLevels()).toBe(0);
  });

  it("inserts children at the front", () => {
    expect(root.child).toBe(c);
    expect(c.nextSibling).toBe(b);
    expect(b.nextSibling).toBe(a);
    expect(a.nextSibling).toBeNull();
    expect(a.prevSibling).toBe(b);
    expect(a.parent).toBe(root);
  });

  it("counts nodes and levels, root at level 0", () => {
    expect(tree.getNumNodes()).toBe(6);
    expect(tree.getNumLevels()).toBe(3);

    const single = new PCSTree();
    single.insert(new PCSNode("Only"), null);
    expect(single.getNumLevels()).toBe(1);
  });

  it("iterates depth-first pre-order", () => {
    expect(names(tree)).toEqual(["Root", "C", "B", "A", "E", "D"]);
  });

  it("reverse iteration is the exact reverse of forward", () => {
    expect(names(tree.reverse())).toEqual([...names(tree)].reverse());
  });

  it("reparents a linked node without duplicating it", () => {
    tree.insert(d, b);
    expect(a.child).toBe(e);
    expect(e.nextSibling).toBeNull();
    expect(b.child).toBe(d);
    expect(d.parent).toBe(b);
    expect(names(tree)).toEqual(["Root", "C", "B", "D", "A", "E"]);
  });

  it("re-rooting detaches the old root", () => {
    const fresh: PCSNode = new PCSNode("Fresh");
    tree.insert(fresh, null);
    expect(tree.root).toBe(fresh);
    expect(names(tree)).toEqual(["Fresh"]);
  });

  it("removes a first child", () => {
    tree.remove(c);
    expect(root.child).toBe(b);
    expect(b.prevSibling).toBeNull();
    expect(names(tree)).toEqual(["Root", "B", "A", "E", "D"]);
  });

  it("removes a middle child", () => {
    tree.remove(b);
    expect(c.nextSibling).toBe(a);
    expect(a.prevSibling).toBe(c);
    expect(names(tree)).toEqual(["Root", "C", "A", "E", "D"]);
  });

  it("removes a last child", () => {
    tree.remove(a);
    expect(b.nextSibling).toBeNull();
    expect(names(tree)).toEqual(["Root", "C", "B"]);
  });

  it("removes an only child", () => {
    tree.remove(e);
    tree.remove(d);
    expect(a.child).toBeNull();
    expect(names(tree)).toEqual(["Root", "C", "B", "A"]);
  });

  it("detaches the subtree intact and re-inserts it", () => {
    tree.remove(a);
    expect(a.parent).toBeNull();
    expect(a.prevSibling).toBeNull();
    expect(a.nextSibling).toBeNull();
    expect(a.child).toBe(e);
    expect(e.nextSibling).toBe(d);

    tree.insert(a, b);
    expect(names(tree)).toEqual(["Root", "C", "B", "A", "E", "D"]);
    expect(tree.getNumLevels()).toBe(4);
  });

  it("removes the root", () => {
    tree.remove(root);
    expect(tree.root).toBeNull();
    expect(tree.getNumNodes()).toBe(0);
  });
});
