export function inicialDe(nombre: string): string {
  const primerCaracter = nombre.trim().charAt(0);
  return primerCaracter ? primerCaracter.toLocaleUpperCase("es") : "?";
}
