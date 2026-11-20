import { describe, expect, it } from "bun:test";
import { registerSchema } from "../../src/validators/auth.validator.ts";

describe("registerSchema Validation (Zod v4)", () => {
  it("should validate and sanitize valid registration input", () => {
    const input = {
      email: "  John.Doe@EXAMPLE.COM  ",
      password: "SecurePassword123",
      fullName: "  John Doe  ",
    };

    const result = registerSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john.doe@example.com");
      expect(result.data.password).toBe("SecurePassword123");
      expect(result.data.fullName).toBe("John Doe");
    }
  });

  describe("email validation", () => {
    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "missingatsign.com",
        "@missingusername.com",
        "spaces in@email.com",
      ];

      for (const email of invalidEmails) {
        const result = registerSchema.safeParse({
          email,
          password: "ValidPassword1",
          fullName: "Valid Name",
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("password validation", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Pass1",
        fullName: "Test User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("at least 8 characters"))).toBe(
          true,
        );
      }
    });

    it("should reject passwords without numbers", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "OnlyLettersPassword",
        fullName: "Test User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes("must contain at least one letter and one number"),
          ),
        ).toBe(true);
      }
    });

    it("should reject passwords without letters", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "1234567890",
        fullName: "Test User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes("must contain at least one letter and one number"),
          ),
        ).toBe(true);
      }
    });

    it("should reject passwords exceeding 100 characters to prevent DoS attacks", () => {
      const longPassword = "A1".repeat(51); // 102 chars
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: longPassword,
        fullName: "Test User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("not exceed 100 characters"))).toBe(
          true,
        );
      }
    });
  });

  describe("fullName validation", () => {
    it("should reject full names shorter than 2 characters", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "ValidPassword1",
        fullName: " A ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty full names", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "ValidPassword1",
        fullName: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject full names exceeding 255 characters", () => {
      const longName = "A".repeat(256);
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "ValidPassword1",
        fullName: longName,
      });
      expect(result.success).toBe(false);
    });
  });
});
