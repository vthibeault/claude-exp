import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type Dispatch,
  type ReactNode,
  createElement,
} from "react";

// ---------------------------------------------------------------------------
// Schema interface — intentionally compatible with Zod's API
// ---------------------------------------------------------------------------

export interface FormError {
  flatten(): { fieldErrors: Record<string, string[]> };
}

export interface FormSchema<T extends Record<string, unknown>> {
  /** Throws a FormError-shaped error on failure. */
  parse(data: unknown): T;
  /** Never throws; returns a discriminated union. */
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: FormError };
}

// ---------------------------------------------------------------------------
// Public config
// ---------------------------------------------------------------------------

export interface FormConfig<T extends Record<string, unknown>> {
  schema?: FormSchema<T>;
  defaultValues: T;
  onSubmit: (values: T) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Internal state & actions
// ---------------------------------------------------------------------------

interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

type FormAction<T extends Record<string, unknown>> =
  | { type: "SET_VALUE"; name: keyof T; value: T[keyof T] }
  | { type: "SET_TOUCHED"; name: keyof T }
  | { type: "SET_ERRORS"; errors: Partial<Record<keyof T, string>> }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "RESET"; defaultValues: T };

function createReducer<T extends Record<string, unknown>>(defaultValues: T) {
  return function reducer(
    state: FormState<T>,
    action: FormAction<T>,
  ): FormState<T> {
    switch (action.type) {
      case "SET_VALUE": {
        const values = { ...state.values, [action.name]: action.value };
        const isDirty = (Object.keys(defaultValues) as Array<keyof T>).some(
          (k) => values[k] !== defaultValues[k],
        );
        return { ...state, values, isDirty };
      }
      case "SET_TOUCHED":
        return {
          ...state,
          touched: { ...state.touched, [action.name]: true },
        };
      case "SET_ERRORS":
        return { ...state, errors: action.errors };
      case "SET_SUBMITTING":
        return { ...state, isSubmitting: action.isSubmitting };
      case "RESET":
        return {
          values: action.defaultValues,
          errors: {},
          touched: {},
          isSubmitting: false,
          isDirty: false,
        };
      default:
        return state;
    }
  };
}

// ---------------------------------------------------------------------------
// Per-field bag returned by useField
// ---------------------------------------------------------------------------

export interface FieldBag<V> {
  value: V;
  onChange: (value: V) => void;
  onBlur: () => void;
  error: string | undefined;
  touched: boolean;
  /** Spread these onto the native/custom input element. */
  inputProps: {
    id: string;
    value: V;
    onChange: (value: V) => void;
    onBlur: () => void;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  };
  /** Spread these onto the label element. */
  labelProps: { htmlFor: string };
  /** Spread these onto the error message element. */
  errorProps: { id: string; role: "alert" };
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface FormContextValue<T extends Record<string, unknown>> {
  state: FormState<T>;
  dispatch: Dispatch<FormAction<T>>;
  config: FormConfig<T>;
  schema: FormSchema<T> | undefined;
}

// ---------------------------------------------------------------------------
// createForm — main factory
// ---------------------------------------------------------------------------

export function createForm<T extends Record<string, unknown>>(config: FormConfig<T>) {
  // One context per form instance, created at call-time (outside any render).
  const FormContext = createContext<FormContextValue<T> | null>(null);

  function useFormContext(): FormContextValue<T> {
    const ctx = useContext(FormContext);
    if (!ctx) throw new Error("useFormContext must be used inside FormProvider");
    return ctx;
  }

  // -------------------------------------------------------------------------
  // FormProvider
  // -------------------------------------------------------------------------

  function FormProvider({ children }: { children: ReactNode }) {
    const reducer = useMemo(() => createReducer(config.defaultValues), []);
    const [state, dispatch] = useReducer(reducer, {
      values: config.defaultValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });

    const value = useMemo<FormContextValue<T>>(
      () => ({ state, dispatch, config, schema: config.schema }),
      [state, dispatch],
    );

    return createElement(FormContext.Provider, { value }, children);
  }

  // -------------------------------------------------------------------------
  // useFormState
  // -------------------------------------------------------------------------

  function useFormState() {
    const { state } = useFormContext();
    return {
      values: state.values,
      errors: state.errors,
      touched: state.touched,
      isSubmitting: state.isSubmitting,
      isDirty: state.isDirty,
    };
  }

  // -------------------------------------------------------------------------
  // useField
  // -------------------------------------------------------------------------

  function useField<K extends keyof T>(name: K): FieldBag<T[K]> {
    const { state, dispatch, schema } = useFormContext();

    const id = `field-${String(name)}`;
    const errorId = `${id}-error`;

    const value = state.values[name];
    const error = state.errors[name];
    const touched = !!state.touched[name];

    const onChange = useCallback(
      (newValue: T[K]) => {
        dispatch({ type: "SET_VALUE", name, value: newValue as T[keyof T] });
      },
      [dispatch, name],
    );

    const onBlur = useCallback(() => {
      dispatch({ type: "SET_TOUCHED", name });

      // Validate this single field on blur when a schema is provided.
      if (schema) {
        const result = schema.safeParse(state.values);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors;
          const fieldError = fieldErrors[String(name)]?.[0];
          dispatch({
            type: "SET_ERRORS",
            errors: {
              ...state.errors,
              [name]: fieldError,
            } as Partial<Record<keyof T, string>>,
          });
        } else {
          // Field is now valid — clear its error only.
          const { [name]: _removed, ...rest } = state.errors;
          dispatch({
            type: "SET_ERRORS",
            errors: rest as Partial<Record<keyof T, string>>,
          });
        }
      }
    }, [dispatch, name, schema, state.values, state.errors]);

    const inputProps = {
      id,
      value,
      onChange,
      onBlur,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? errorId : undefined,
    };

    const labelProps = { htmlFor: id };
    const errorProps = { id: errorId, role: "alert" as const };

    return { value, onChange, onBlur, error, touched, inputProps, labelProps, errorProps };
  }

  // -------------------------------------------------------------------------
  // handleSubmit
  // -------------------------------------------------------------------------

  // handleSubmit needs access to the current context, so we expose a hook
  // version that components can use. We also return a stable reference to
  // a function that, when called inside a provider, reads context.
  //
  // Pattern: return a hook so the caller can get a stable callback.

  function useHandleSubmit() {
    const { state, dispatch, config: cfg, schema } = useFormContext();

    return useCallback(
      async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Mark all fields as touched so errors become visible.
        const allTouched = Object.fromEntries(
          Object.keys(state.values).map((k) => [k, true]),
        ) as Partial<Record<keyof T, boolean>>;
        dispatch({ type: "SET_TOUCHED", name: Object.keys(state.values)[0] as keyof T });
        // Dispatch individual SET_TOUCHED for each key.
        for (const key of Object.keys(state.values) as Array<keyof T>) {
          dispatch({ type: "SET_TOUCHED", name: key });
        }
        void allTouched; // used above

        if (schema) {
          const result = schema.safeParse(state.values);
          if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const errors = Object.fromEntries(
              Object.entries(fieldErrors).map(([k, v]) => [k, (v as string[])[0]]),
            ) as Partial<Record<keyof T, string>>;
            dispatch({ type: "SET_ERRORS", errors });
            return;
          }
          // Clear all errors on success.
          dispatch({ type: "SET_ERRORS", errors: {} });
          dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
          try {
            await cfg.onSubmit(result.data);
          } finally {
            dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
          }
        } else {
          // No schema — submit raw values.
          dispatch({ type: "SET_ERRORS", errors: {} });
          dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
          try {
            await cfg.onSubmit(state.values);
          } finally {
            dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
          }
        }
      },
      [state.values, state.errors, dispatch, cfg, schema],
    );
  }

  return { FormProvider, useFormState, useField, useHandleSubmit };
}

// ---------------------------------------------------------------------------
// Convenience type for the return value of createForm
// ---------------------------------------------------------------------------

export type FormInstance<T extends Record<string, unknown>> = ReturnType<typeof createForm<T>>;
