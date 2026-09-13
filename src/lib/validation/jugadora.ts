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

  if (values.numeroCamiseta.trim() && Number.isNaN(Number(values.numeroCamiseta))) {
    errors.numeroCamiseta = "El número debe ser un valor numérico.";
  }

  return errors;
}
