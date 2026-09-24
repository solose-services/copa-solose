const PATRON_DRIVE =
  /drive\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|open\?(?:[^#]*&)?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([\w-]{10,})/;

export function urlImagen(url: string | null | undefined, tamano = 200): string | null {
  const limpia = url?.trim();
  if (!limpia) return null;

  const coincidencia = PATRON_DRIVE.exec(limpia);
  if (!coincidencia) return limpia;

  return `https://lh3.googleusercontent.com/d/${coincidencia[1]}=s${Math.round(tamano)}`;
}
