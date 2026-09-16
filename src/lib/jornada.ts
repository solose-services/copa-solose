export function formatearEtiquetaJornada(etiqueta: string): string {
  const limpia = etiqueta.trim();
  return /^\d+$/.test(limpia) ? `J${limpia}` : etiqueta;
}

export function tituloJornada(etiqueta: string): string {
  const limpia = etiqueta.trim();
  return /^\d+$/.test(limpia) ? `Jornada ${limpia}` : etiqueta;
}
