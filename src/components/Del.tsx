import { useId, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

type DelProps = {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
  className?: string;
  titleAttr?: string;
  ariaLabel?: string;
  disabled?: boolean;
  overlayClassName?: string;
  stopPropagation?: boolean;
};

export default function Del({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  children,
  className,
  titleAttr,
  ariaLabel,
  disabled = false,
  overlayClassName = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs animate-fade-in',
  stopPropagation = true
}: DelProps) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    setIsOpen(true);
  };

  const handleCancelClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    setIsOpen(false);
  };

  const handleConfirmClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation();
    setIsConfirming(true);

    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={className}
        title={titleAttr || title}
        aria-label={ariaLabel || title}
      >
        {children || <Trash2 className="h-4 w-4" />}
      </button>

      {isOpen && createPortal((
        <div className={overlayClassName} onClick={(event) => stopPropagation && event.stopPropagation()}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="pu flex w-full max-w-xs flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl animate-scale-up"
          >
            <div className="pu-head flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Trash2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 id={titleId}>{title}</h3>
                {message && (
                  <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                    {message}
                  </p>
                )}
              </div>
            </div>
            <div className="pu-footer">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isConfirming}
                className="pu-button-secondary flex-1 focus:outline-none"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={isConfirming}
                className="pu-button-primary flex-1 !bg-rose-500 hover:!bg-rose-600 focus:outline-none disabled:cursor-wait disabled:opacity-70"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
