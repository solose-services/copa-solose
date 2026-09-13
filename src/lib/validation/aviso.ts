export interface AvisoFormValues {
  titulo: string;
  cuerpo: string;
  imagenUrl: string;
}

export interface AvisoFormErrors {
  titulo?: string;
  cuerpo?: string;
  imagenUrl?: string;
}

export function validateAvisoForm(values: AvisoFormValues): AvisoFormErrors {
  const errors: AvisoFormErrors = {};

  if (!values.titulo.trim()) {
    errors.titulo = "El título es obligatorio.";
  }
  if (!values.cuerpo.trim()) {
    errors.cuerpo = "El cuerpo es obligatorio.";
  }

  return errors;
}
