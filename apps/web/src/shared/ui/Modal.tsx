import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  /** Buttons along the bottom edge. */
  footer?: ReactNode;
  /** Called on Esc, the ✕ button and backdrop clicks; omit to make the dialog blocking. */
  onClose?: () => void;
  size?: 'small' | 'medium';
}

/**
 * A modal dialog on the native <dialog> element: showModal() gives focus
 * trapping, inert background and Esc handling for free.
 */
export function Modal({ open, title, children, footer, onClose, size = 'medium' }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // jsdom has no showModal
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // React state decides when it closes
        onClose?.();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.(); // backdrop
      }}
    >
      <div className="modal__inner">
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            <span className="tok-com">{'// '}</span>
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className="btn btn--icon"
              aria-label={t('common.close')}
              onClick={onClose}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
