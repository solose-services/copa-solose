export interface JornadaFormValues {
  etiqueta: string;
  tipo: string;
  orden: string;
}

export interface JornadaFormErrors {
  etiqueta?: string;
  tipo?: string;
  orden?: string;
}

export function validateJornadaForm(values: JornadaFormValues): JornadaFormErrors {
  const errors: JornadaFormErrors = {};

  if (!values.etiqueta.trim()) {
    errors.etiqueta = "La etiqueta es obligatoria.";
  }

  if (values.tipo !== "regular" && values.tipo !== "liguilla") {
    errors.tipo = "Selecciona un tipo válido.";
  }

  if (!/^\d+$/.test(values.orden.trim())) {
    errors.orden = "El orden debe ser un número entero positivo.";
  }

  return errors;
}
