import { describe, expect, it } from "vitest";
import { urlImagen } from "./imagen";

const ID = "18KXKWQxDGLVDJwplvv_aiTXI2aPo0PdJ";

describe("urlImagen", () => {
  it("convierte un link de Drive tipo /file/d/ID/view a imagen directa", () => {
    expect(urlImagen(`https://drive.google.com/file/d/${ID}/view?usp=drive_link`, 160)).toBe(
      `https://lh3.googleusercontent.com/d/${ID}=s160`
    );
  });

  it("convierte links open?id= y uc?export=view&id=", () => {
    expect(urlImagen(`https://drive.google.com/open?id=${ID}`)).toBe(
      `https://lh3.googleusercontent.com/d/${ID}=s200`
    );
    expect(urlImagen(`https://drive.google.com/uc?export=view&id=${ID}`)).toBe(
      `https://lh3.googleusercontent.com/d/${ID}=s200`
    );
  });

  it("deja intactos los links que no son de Drive", () => {
    expect(urlImagen("https://ejemplo.com/foto.png")).toBe("https://ejemplo.com/foto.png");
  });

  it("devuelve null para valores vacíos", () => {
    expect(urlImagen(null)).toBeNull();
    expect(urlImagen("   ")).toBeNull();
  });
});
