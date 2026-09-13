export interface PartidoFormValues {
  equipoLocalId: string;
  equipoVisitanteId: string;
  fecha: string;
}

export interface PartidoFormErrors {
  equipoLocalId?: string;
  equipoVisitanteId?: string;
  fecha?: string;
}

export function validatePartidoForm(values: PartidoFormValues): PartidoFormErrors {
  const errors: PartidoFormErrors = {};

  if (!values.equipoLocalId) {
    errors.equipoLocalId = "Selecciona el equipo local.";
  }

  if (!values.equipoVisitanteId) {
    errors.equipoVisitanteId = "Selecciona el equipo visitante.";
  }

  if (
    values.equipoLocalId &&
    values.equipoVisitanteId &&
    values.equipoLocalId === values.equipoVisitanteId
  ) {
    errors.equipoVisitanteId = "El equipo visitante debe ser distinto al local.";
  }

  if (!values.fecha.trim()) {
    errors.fecha = "La fecha es obligatoria.";
  }

  return errors;
}
