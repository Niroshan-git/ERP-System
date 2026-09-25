import { describe, expect, it } from "vitest";
import { resolveTemplate } from "../templateResolver";

describe("resolveTemplate", () => {
  it("always resolves to the single V1 standard template regardless of doctype", () => {
    expect(resolveTemplate("Sales Invoice").id).toBe("ceylon-standard");
    expect(resolveTemplate("Quotation").id).toBe("ceylon-standard");
  });

  it("ignores an unresolved company (V1 scope, LP-1 §6)", () => {
    expect(resolveTemplate("Sales Invoice", "Some Company").id).toBe("ceylon-standard");
  });
});
