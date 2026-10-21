import { describe, expect, it } from "vitest";
import { validateAuth } from "@/components/AuthForm";

describe("validación de registro", () => {
  it("exige al menos 8 caracteres de contraseña", () => {
    expect(
      validateAuth("registro", { email: "a@b.com", password: "1234567", confirm: "1234567" })
        .password,
    ).toBeDefined();
  });
  it("detecta contraseñas que no coinciden", () => {
    expect(
      validateAuth("registro", { email: "a@b.com", password: "12345678", confirm: "x" }).confirm,
    ).toBeDefined();
  });
});
