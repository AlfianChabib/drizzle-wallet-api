import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../../src/app.ts";
import { authService } from "../../src/services/auth.service.ts";
import { ConflictError } from "../../src/utils/errors.ts";

describe("POST /api/v1/auth/register (Integration)", () => {
  it("should return 400 Bad Request when payload is invalid", async () => {
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "short",
        fullName: "",
      }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("should return 409 Conflict when email is already registered", async () => {
    const registerSpy = spyOn(authService, "register").mockImplementation(async () => {
      throw new ConflictError("Email already registered");
    });

    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "duplicate@example.com",
        password: "Password123",
        fullName: "Duplicate User",
      }),
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as any;
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email already registered");
    expect(body.error.code).toBe("CONFLICT");

    registerSpy.mockRestore();
  });

  it("should return 201 Created with user profile and token on successful registration", async () => {
    const registerSpy = spyOn(authService, "register").mockImplementation(async (input) => ({
      user: {
        id: "01a1f6c4-7d9e-709c-9e37-9a0271807396",
        email: input.email,
        fullName: input.fullName,
        role: "user",
        hasPin: false,
      },
      token: "mock-jwt-token-string",
    }));

    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.customer@example.com",
        password: "ValidPassword123",
        fullName: "Test Customer",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as any;

    expect(body.success).toBe(true);
    expect(body.message).toBe("User registered successfully");
    expect(body.data.user).toEqual({
      id: "01a1f6c4-7d9e-709c-9e37-9a0271807396",
      email: "test.customer@example.com",
      fullName: "Test Customer",
      role: "user",
      hasPin: false,
    });
    expect(body.data.token).toBe("mock-jwt-token-string");

    registerSpy.mockRestore();
  });
});
