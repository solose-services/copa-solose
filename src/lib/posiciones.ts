// src/lib/posiciones.ts
export interface PartidoParaPosiciones {
  equipoLocalId: string;
  equipoVisitanteId: string;
  golesLocal: number;
  golesVisitante: number;
  tarjetasAmarillasLocal: number;
  tarjetasRojasLocal: number;
  tarjetasAmarillasVisitante: number;
  tarjetasRojasVisitante: number;
}

export interface EstadisticaEquipo {
  equipoId: string;
  partidosJugados: number;
  ganados: number;
  empatados: number;
  perdidos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  ordenDesempateManual: number | null;
}

export function calcularPosiciones(
  equipoIds: string[],
  partidos: PartidoParaPosiciones[],
  ordenDesempateManualPorEquipo: Map<string, number | null>
): EstadisticaEquipo[] {
  const stats = new Map<string, EstadisticaEquipo>();
  for (const equipoId of equipoIds) {
    stats.set(equipoId, {
      equipoId,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
      diferenciaGoles: 0,
      puntos: 0,
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
      ordenDesempateManual: ordenDesempateManualPorEquipo.get(equipoId) ?? null,
    });
  }

  for (const partido of partidos) {
    const local = stats.get(partido.equipoLocalId);
    const visitante = stats.get(partido.equipoVisitanteId);
    if (!local || !visitante) continue;

    local.partidosJugados += 1;
    visitante.partidosJugados += 1;
    local.golesFavor += partido.golesLocal;
    local.golesContra += partido.golesVisitante;
    visitante.golesFavor += partido.golesVisitante;
    visitante.golesContra += partido.golesLocal;
    local.tarjetasAmarillas += partido.tarjetasAmarillasLocal;
    local.tarjetasRojas += partido.tarjetasRojasLocal;
    visitante.tarjetasAmarillas += partido.tarjetasAmarillasVisitante;
    visitante.tarjetasRojas += partido.tarjetasRojasVisitante;

    if (partido.golesLocal > partido.golesVisitante) {
      local.ganados += 1;
      local.puntos += 3;
      visitante.perdidos += 1;
    } else if (partido.golesLocal < partido.golesVisitante) {
      visitante.ganados += 1;
      visitante.puntos += 3;
      local.perdidos += 1;
    } else {
      local.empatados += 1;
      visitante.empatados += 1;
      local.puntos += 1;
      visitante.puntos += 1;
    }
  }

  for (const estadistica of stats.values()) {
    estadistica.diferenciaGoles = estadistica.golesFavor - estadistica.golesContra;
  }

  const resultadoDirecto = calcularResultadoDirecto(partidos);
  const lista = Array.from(stats.values());

  lista.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;

    const directoA = resultadoDirecto.get(`${a.equipoId}:${b.equipoId}`) ?? 0;
    const directoB = resultadoDirecto.get(`${b.equipoId}:${a.equipoId}`) ?? 0;
    if (directoA !== directoB) return directoB - directoA;

    const tarjetasA = a.tarjetasAmarillas + a.tarjetasRojas;
    const tarjetasB = b.tarjetasAmarillas + b.tarjetasRojas;
    if (tarjetasA !== tarjetasB) return tarjetasA - tarjetasB;

    const ordenA = a.ordenDesempateManual ?? Number.MAX_SAFE_INTEGER;
    const ordenB = b.ordenDesempateManual ?? Number.MAX_SAFE_INTEGER;
    return ordenA - ordenB;
  });

  return lista;
}

function calcularResultadoDirecto(partidos: PartidoParaPosiciones[]): Map<string, number> {
  const puntosDirectos = new Map<string, number>();

  const sumar = (equipoId: string, rivalId: string, puntos: number) => {
    const clave = `${equipoId}:${rivalId}`;
    puntosDirectos.set(clave, (puntosDirectos.get(clave) ?? 0) + puntos);
  };

  for (const partido of partidos) {
    if (partido.golesLocal > partido.golesVisitante) {
      sumar(partido.equipoLocalId, partido.equipoVisitanteId, 3);
    } else if (partido.golesLocal < partido.golesVisitante) {
      sumar(partido.equipoVisitanteId, partido.equipoLocalId, 3);
    } else {
      sumar(partido.equipoLocalId, partido.equipoVisitanteId, 1);
      sumar(partido.equipoVisitanteId, partido.equipoLocalId, 1);
    }
  }

  return puntosDirectos;
}
