import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { Field } from "./field";
import type { FormInstance, FieldBag } from "../lib/form";

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export interface FormProps<T extends Record<string, unknown>>
  extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  /** The form instance created by `createForm()`. */
  form: FormInstance<T>;
  children: ReactNode;
}

/**
 * Renders a `<form>` element wired to the headless form engine.
 * Wraps children in the form's `FormProvider` context automatically.
 */
export function Form<T extends Record<string, unknown>>({
  form,
  children,
  ...props
}: FormProps<T>) {
  const { FormProvider } = form;

  return (
    <FormProvider>
      <FormInner form={form} htmlProps={props}>
        {children}
      </FormInner>
    </FormProvider>
  );
}

// Inner component lives inside the provider so it can call useHandleSubmit.
function FormInner<T extends Record<string, unknown>>({
  form,
  children,
  htmlProps,
}: {
  form: FormInstance<T>;
  children: ReactNode;
  htmlProps: Omit<HTMLAttributes<HTMLFormElement>, "onSubmit">;
}) {
  const handleSubmit = form.useHandleSubmit();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    void handleSubmit(e);
  }

  return (
    <form onSubmit={onSubmit} {...htmlProps}>
      {children}
    </form>
  );
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

export interface FormFieldProps<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
> {
  /** The form instance created by `createForm()`. */
  form: FormInstance<T>;
  /** The field key in the form's value type. */
  name: K;
  /** Label text passed to the underlying `Field` component. */
  label: ReactNode;
  /** Whether the field is required (decorative asterisk + aria-required). */
  required?: boolean;
  /** Optional description text shown below the control when there is no error. */
  description?: ReactNode;
  /**
   * Render-prop child receives the field bag so the caller can wire
   * `inputProps` onto any input element.
   *
   * @example
   * <FormField form={myForm} name="email" label="Email">
   *   {({ inputProps }) => <Input type="email" {...inputProps} />}
   * </FormField>
   */
  children: (bag: FieldBag<T[K]>) => ReactNode;
}

/**
 * Thin wrapper around the existing `Field` component.
 * Reads field state via `useField` and auto-wires `error`, `id`, and aria
 * attributes — the consumer only needs to spread `inputProps` onto their input.
 */
export function FormField<T extends Record<string, unknown>, K extends keyof T>({
  form,
  name,
  label,
  required,
  description,
  children,
}: FormFieldProps<T, K>) {
  const bag = form.useField(name);

  return (
    <Field
      label={label}
      error={bag.touched ? bag.error : undefined}
      required={required}
      description={description}
    >
      {/* Field clones its child and injects id/aria props; we pass a wrapper
          element so that Field's cloneElement receives a real ReactElement.
          The render prop still gives the caller full control over the input. */}
      <_FieldSlot>{children(bag)}</_FieldSlot>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Internal helper: a transparent wrapper that forwards Field's injected props
// (id, aria-invalid, aria-describedby, aria-required) onto the render-prop
// child via cloneElement.
// ---------------------------------------------------------------------------

import { cloneElement, isValidElement } from "react";

interface FieldSlotProps {
  children: ReactNode;
  // Props injected by Field's cloneElement call:
  id?: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

function _FieldSlot({
  children,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  "aria-required": ariaRequired,
}: FieldSlotProps) {
  if (!isValidElement<Record<string, unknown>>(children)) return <>{children}</>;
  return cloneElement(children, {
    ...(id !== undefined && { id }),
    ...(ariaInvalid !== undefined && { "aria-invalid": ariaInvalid }),
    ...(ariaDescribedby !== undefined && { "aria-describedby": ariaDescribedby }),
    ...(ariaRequired !== undefined && { "aria-required": ariaRequired }),
  });
}
