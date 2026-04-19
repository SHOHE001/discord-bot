import { describe, it } from "node:test";
import assert from "node:assert";
import { embedColor } from "./api";

describe("weather api: embedColor", () => {
  it("should return yellow for clear sky (01)", () => {
    assert.strictEqual(embedColor("01d"), 0xf9c74f);
    assert.strictEqual(embedColor("01n"), 0xf9c74f);
  });

  it("should return light blue for few/scattered clouds (02, 03)", () => {
    assert.strictEqual(embedColor("02d"), 0x90e0ef);
    assert.strictEqual(embedColor("02n"), 0x90e0ef);
    assert.strictEqual(embedColor("03d"), 0x90e0ef);
    assert.strictEqual(embedColor("03n"), 0x90e0ef);
  });

  it("should return gray for broken clouds (04)", () => {
    assert.strictEqual(embedColor("04d"), 0x9b9b9b);
    assert.strictEqual(embedColor("04n"), 0x9b9b9b);
  });

  it("should return blue for rain (09, 10)", () => {
    assert.strictEqual(embedColor("09d"), 0x4895ef);
    assert.strictEqual(embedColor("09n"), 0x4895ef);
    assert.strictEqual(embedColor("10d"), 0x4895ef);
    assert.strictEqual(embedColor("10n"), 0x4895ef);
  });

  it("should return purple for thunderstorm (11)", () => {
    assert.strictEqual(embedColor("11d"), 0x7b2d8b);
    assert.strictEqual(embedColor("11n"), 0x7b2d8b);
  });

  it("should return white-ish for snow (13)", () => {
    assert.strictEqual(embedColor("13d"), 0xdff8eb);
    assert.strictEqual(embedColor("13n"), 0xdff8eb);
  });

  it("should return default blue for unknown icons", () => {
    assert.strictEqual(embedColor("50d"), 0x4895ef); // Mist
    assert.strictEqual(embedColor("unknown"), 0x4895ef);
    assert.strictEqual(embedColor(""), 0x4895ef);
  });

  it("should handle unexpected prefix matches correctly", () => {
    // Current implementation uses startsWith, so "01xyz" would match "01"
    assert.strictEqual(embedColor("01any"), 0xf9c74f);
  });
});
