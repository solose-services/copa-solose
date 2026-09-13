export interface SuspensionFormValues {
  jugadoraId: string;
  jornadaDesdeId: string;
  jornadaHastaId: string;
  motivo: string;
}

export interface SuspensionFormErrors {
  jugadoraId?: string;
  jornadaDesdeId?: string;
  jornadaHastaId?: string;
}

export function validateSuspensionForm(values: SuspensionFormValues): SuspensionFormErrors {
  const errors: SuspensionFormErrors = {};

  if (!values.jugadoraId) {
    errors.jugadoraId = "Selecciona a la jugadora.";
  }
  if (!values.jornadaDesdeId) {
    errors.jornadaDesdeId = "Selecciona la jornada de inicio.";
  }
  if (!values.jornadaHastaId) {
    errors.jornadaHastaId = "Selecciona la jornada final.";
  }

  return errors;
}
