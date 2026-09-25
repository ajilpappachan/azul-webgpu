import { describe, it, expect, beforeEach } from "vitest";
import { Manager } from "@azul/manager";

class Item {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

describe("Manager", () => {
  let manager: Manager<Item>;
  let crate: Item, mousey: Item, maria: Item;

  beforeEach(() => {
    manager = new Manager<Item>();
    crate = new Item("crate");
    mousey = new Item("mousey");
    maria = new Item("maria");
  });

  it("starts empty", () => {
    expect(manager.count).toBe(0);
    expect(manager.find("crate")).toBeUndefined();
    expect([...manager]).toEqual([]);
  });

  it("adds and finds by name, returning the item", () => {
    expect(manager.add("crate", crate)).toBe(crate);
    manager.add("mousey", mousey);
    expect(manager.count).toBe(2);
    expect(manager.find("crate")).toBe(crate);
    expect(manager.find("mousey")).toBe(mousey);
    expect(manager.find("maria")).toBeUndefined();
  });

  it("refuses a duplicate name and keeps the original", () => {
    manager.add("crate", crate);
    expect(() => manager.add("crate", mousey)).toThrow('"crate" already added');
    expect(manager.find("crate")).toBe(crate);
    expect(manager.count).toBe(1);
  });

  it("removes by name, reporting whether anything was there", () => {
    manager.add("crate", crate);
    manager.add("mousey", mousey);
    expect(manager.remove("crate")).toBe(true);
    expect(manager.remove("crate")).toBe(false);
    expect(manager.find("crate")).toBeUndefined();
    expect(manager.count).toBe(1);
  });

  it("lets a removed name be added again", () => {
    manager.add("crate", crate);
    manager.remove("crate");
    manager.add("crate", mousey);
    expect(manager.find("crate")).toBe(mousey);
  });

  it("iterates items in insertion order", () => {
    manager.add("maria", maria);
    manager.add("crate", crate);
    manager.add("mousey", mousey);
    expect([...manager]).toEqual([maria, crate, mousey]);
  });
});
