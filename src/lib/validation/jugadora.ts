export interface JugadoraFormValues {
  nombre: string;
  numeroCamiseta: string;
  fotoUrl: string;
}

export interface JugadoraFormErrors {
  nombre?: string;
  numeroCamiseta?: string;
}

export function validateJugadoraForm(values: JugadoraFormValues): JugadoraFormErrors {
  const errors: JugadoraFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (values.numeroCamiseta.trim() && !/^\d+$/.test(values.numeroCamiseta.trim())) {
    errors.numeroCamiseta = "El número debe ser un número entero positivo.";
  }

  return errors;
}
