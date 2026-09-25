import { describe, expect, it } from "vitest";
import { htmlBlockToPlainText, resolveFileUrl } from "../shared";

describe("htmlBlockToPlainText", () => {
  it("returns undefined for empty/missing input", () => {
    expect(htmlBlockToPlainText(undefined)).toBeUndefined();
    expect(htmlBlockToPlainText("")).toBeUndefined();
    expect(htmlBlockToPlainText("<div></div>")).toBeUndefined();
  });

  it("strips tags and converts <br>/block closes to newlines", () => {
    const result = htmlBlockToPlainText("<div>123 Main St<br>Colombo 05<br>Sri Lanka</div>");
    expect(result).toBe("123 Main St\nColombo 05\nSri Lanka");
  });

  it("decodes common HTML entities and collapses excess blank lines", () => {
    const result = htmlBlockToPlainText("<p>Tom &amp; Jerry</p><p></p><p>Line&nbsp;Two</p>");
    expect(result).toContain("Tom & Jerry");
    expect(result).toContain("Line Two");
    expect(result).not.toMatch(/\n{3,}/);
  });

  it("never leaves a stray tag in the output (closes the XSS-shaped concern by construction)", () => {
    const result = htmlBlockToPlainText('<img src=x onerror="alert(1)">Hello');
    expect(result).toBe("Hello");
  });
});

describe("resolveFileUrl", () => {
  it("returns undefined for a missing path", () => {
    expect(resolveFileUrl(undefined)).toBeUndefined();
    expect(resolveFileUrl(null)).toBeUndefined();
  });

  it("passes through an already-absolute URL unchanged", () => {
    expect(resolveFileUrl("https://cdn.example.test/logo.png")).toBe("https://cdn.example.test/logo.png");
  });
});
