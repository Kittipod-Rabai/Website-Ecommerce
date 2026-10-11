import { describe, expect, it } from "vitest";
import { formatBaht, toSatang } from "./money";

describe("money", () => {
  it("converts baht to satang without float drift", () => {
    expect(toSatang(19.99)).toBe(1999);
    expect(toSatang(1290)).toBe(129000);
  });
  it("formats satang as baht", () => {
    expect(formatBaht(129000)).toBe("฿1,290");
    expect(formatBaht(1999)).toBe("฿19.99");
  });
});
