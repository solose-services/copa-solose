export function formatearHora(hora: string): string {
  const [horas, minutos] = hora.split(":");
  return `${parseInt(horas, 10)}:${minutos}`;
}

export function formatearFechaCorta(fecha: string): string {
  const fechaSegura = new Date(`${fecha}T12:00:00`);
  const dia = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    timeZone: "America/Mexico_City",
  }).format(fechaSegura);
  const diaMes = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  }).format(fechaSegura);
  return `${dia} ${diaMes}`;
}
