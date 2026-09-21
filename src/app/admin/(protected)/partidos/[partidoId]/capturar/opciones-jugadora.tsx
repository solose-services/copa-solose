export interface JugadoraOpcion {
  id: string;
  nombre: string;
  equipoId: string;
}

export function OpcionesJugadora({
  jugadoras,
  equipoLocalId,
  nombreLocal,
  equipoVisitanteId,
  nombreVisitante,
}: {
  jugadoras: JugadoraOpcion[];
  equipoLocalId: string;
  nombreLocal: string;
  equipoVisitanteId: string;
  nombreVisitante: string;
}) {
  const local = jugadoras.filter((jugadora) => jugadora.equipoId === equipoLocalId);
  const visitante = jugadoras.filter((jugadora) => jugadora.equipoId === equipoVisitanteId);

  return (
    <>
      {local.length > 0 && (
        <optgroup label={nombreLocal}>
          {local.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </optgroup>
      )}
      {visitante.length > 0 && (
        <optgroup label={nombreVisitante}>
          {visitante.map((jugadora) => (
            <option key={jugadora.id} value={jugadora.id}>
              {jugadora.nombre}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}
