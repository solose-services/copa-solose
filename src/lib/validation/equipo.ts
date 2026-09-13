export interface EquipoFormValues {
  nombre: string;
  logoUrl: string;
}

export interface EquipoFormErrors {
  nombre?: string;
  logoUrl?: string;
}

export function validateEquipoForm(values: EquipoFormValues): EquipoFormErrors {
  const errors: EquipoFormErrors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  return errors;
}
