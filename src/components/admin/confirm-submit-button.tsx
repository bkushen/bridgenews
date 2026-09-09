"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  label?: string;
  pendingLabel?: string;
  confirmMessage?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function ConfirmSubmitButton({
  label = "Delete",
  pendingLabel = "Working…",
  confirmMessage = "Are you sure?",
  className = "",
  formAction,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
