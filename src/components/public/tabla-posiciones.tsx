import { NombreEquipo } from "@/components/public/nombre-equipo";
import type { EstadisticaEquipo } from "@/lib/posiciones";

const EQUIPOS_QUE_CLASIFICAN = 4;

export function TablaPosiciones({
  titulo,
  tabla,
  equipoInfoPorId,
}: {
  titulo?: string;
  tabla: EstadisticaEquipo[];
  equipoInfoPorId: Map<string, { nombre: string; logoUrl: string | null }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {titulo && (
        <h2 className="font-tit text-sm uppercase tracking-[.1em] text-tinta-2">{titulo}</h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                Equipo
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                PJ
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                Pts
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                GF
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                GC
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                DG
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                TA
              </th>
              <th className="border-b border-linea p-2 font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
                TR
              </th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila, indice) => {
              const clasifica = indice < EQUIPOS_QUE_CLASIFICAN;
              const esCorte = indice === EQUIPOS_QUE_CLASIFICAN - 1;
              return (
                <tr
                  key={fila.equipoId}
                  className={esCorte ? "border-b-2 border-azul" : "border-b border-linea-2"}
                  style={clasifica ? { background: "var(--amarillo-suave)" } : undefined}
                >
                  <td className="p-2 text-sm">
                    <NombreEquipo
                      id={fila.equipoId}
                      nombre={equipoInfoPorId.get(fila.equipoId)?.nombre ?? "Equipo"}
                      logoUrl={equipoInfoPorId.get(fila.equipoId)?.logoUrl ?? null}
                    />
                  </td>
                  <td className="p-2 text-sm">{fila.partidosJugados}</td>
                  <td className="p-2 text-sm font-medium">{fila.puntos}</td>
                  <td className="p-2 text-sm">{fila.golesFavor}</td>
                  <td className="p-2 text-sm">{fila.golesContra}</td>
                  <td className="p-2 text-sm">{fila.diferenciaGoles}</td>
                  <td className="p-2 text-sm">{fila.tarjetasAmarillas}</td>
                  <td className="p-2 text-sm">{fila.tarjetasRojas}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
