/** Result returned by every admin server action to its form. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Likely duplicates found on save; the form offers "save anyway". */
  duplicates?: { id: string; title: string; href: string }[];
};

export const initialFormState: FormState = {};
