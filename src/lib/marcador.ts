export interface GolParaContar {
  jugadoraId: string;
}

export function contarMarcador(
  goles: GolParaContar[],
  idsJugadorasLocal: Set<string>,
  idsJugadorasVisitante: Set<string>
): { golesLocal: number; golesVisitante: number } {
  let golesLocal = 0;
  let golesVisitante = 0;

  for (const gol of goles) {
    if (idsJugadorasLocal.has(gol.jugadoraId)) {
      golesLocal += 1;
    } else if (idsJugadorasVisitante.has(gol.jugadoraId)) {
      golesVisitante += 1;
    }
  }

  return { golesLocal, golesVisitante };
}
