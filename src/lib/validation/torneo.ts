export interface TorneoFormValues {
  nombre: string;
  categoria: string;
  temporada: string;
}

export interface TorneoFormErrors {
  nombre?: string;
  categoria?: string;
  temporada?: string;
}

export function validateTorneoForm(values: TorneoFormValues): TorneoFormErrors {
  const errors: TorneoFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }
  if (!values.categoria.trim()) {
    errors.categoria = "La categoría es obligatoria.";
  }
  if (!values.temporada.trim()) {
    errors.temporada = "La temporada es obligatoria.";
  }

  return errors;
}
