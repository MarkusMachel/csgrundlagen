import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Labelled password input in the form-field style. Forwards its ref so
 * react-hook-form's register() can attach to the input.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, ...input }, ref) {
    const id = useId();
    return (
      <div className={error ? 'field field--error' : 'field'}>
        <label htmlFor={id}>{label}</label>
        <input ref={ref} id={id} type="password" className="input" {...input} />
        {error && <span className="field-error-text">{error}</span>}
      </div>
    );
  },
);
