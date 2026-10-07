import { describe, expect, it } from "vitest";
import {
  attendancePercentage,
  buildUpiUri,
  buildWaLink,
  dueDateForPeriod,
  effectiveStatus,
  nextStatusAfterPayment,
  renderTemplate,
} from "./index";

describe("buildUpiUri", () => {
  it("builds a valid link", () => {
    const uri = buildUpiUri({
      payeeVpa: "sharma.classes@okhdfc",
      payeeName: "Sharma Classes",
      amount: 1500,
      note: "FEE-123",
    });
    expect(uri).toBe(
      "upi://pay?pa=sharma.classes%40okhdfc&pn=Sharma%20Classes&am=1500.00&cu=INR&tn=FEE-123",
    );
  });
  it("rejects bad VPA and amount", () => {
    expect(() => buildUpiUri({ payeeVpa: "nope", payeeName: "x", amount: 10 })).toThrow();
    expect(() => buildUpiUri({ payeeVpa: "a@b.co", payeeName: "x", amount: 0 })).toThrow();
  });
});

describe("whatsapp helpers", () => {
  it("normalises 10-digit numbers to +91", () => {
    expect(buildWaLink("98765 43210", "Hi there")).toBe("https://wa.me/919876543210?text=Hi%20there");
  });
  it("renders templates", () => {
    expect(renderTemplate("Hi {name}, {x}", { name: "Asha" })).toBe("Hi Asha, {x}");
  });
});

describe("fees", () => {
  it("computes due dates and overdue status", () => {
    expect(dueDateForPeriod("2026-10", 5)).toBe("2026-10-05");
    expect(effectiveStatus("2026-10-05", "pending", "2026-10-07")).toBe("overdue");
    expect(effectiveStatus("2026-10-05", "paid", "2026-10-07")).toBe("paid");
    expect(effectiveStatus("2026-10-10", "pending", "2026-10-07")).toBe("pending");
  });
  it("moves status after payment", () => {
    expect(nextStatusAfterPayment(1000, 400)).toBe("partially_paid");
    expect(nextStatusAfterPayment(1000, 1000)).toBe("paid");
  });
});

describe("attendancePercentage", () => {
  it("ignores excused and counts late as attended", () => {
    expect(attendancePercentage(["present", "late", "absent", "excused"])).toBe(66.7);
    expect(attendancePercentage(["excused"])).toBeNull();
  });
});
