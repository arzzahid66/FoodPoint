"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "./button";
import { Modal } from "./modal";
import type { ActionState } from "@/lib/action-state";

const PendingContext = React.createContext(false);

/**
 * A form that calls a Server Action and shows the result as a toast.
 * Unlike <form action>, it does not reset fields on submit, so input is kept on validation errors.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<ActionState | void>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) toast.error(result.error);
      if (result?.ok) {
        toast.success(result.ok);
        if (resetOnSuccess) form.reset();
        onSuccess?.();
      }
    });
  }

  return (
    <PendingContext.Provider value={pending}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function SubmitButton({ children, pendingText, disabled, ...props }: ButtonProps & { pendingText?: string }) {
  const pending = React.useContext(PendingContext);
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (pendingText ?? "Saving...") : children}
    </Button>
  );
}

/** A submit button that asks for confirmation first. Place it inside an ActionForm. */
export function ConfirmSubmit({
  children,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  ...props
}: ButtonProps & { title?: string; message: string; confirmLabel?: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);
  const pending = React.useContext(PendingContext);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <Button ref={ref} type="button" disabled={pending} onClick={() => setOpen(true)} {...props}>
        {children}
      </Button>
      <Modal open={open} onClose={close} title={title}>
        <p className="text-sm text-zinc-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => {
              setOpen(false);
              ref.current?.form?.requestSubmit();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
