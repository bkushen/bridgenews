"use client";

type ConfirmSubmitButtonProps = {
  label?: string;
  confirmMessage?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function ConfirmSubmitButton({
  label = "Delete",
  confirmMessage = "Are you sure?",
  className = "",
  formAction,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={className}
    >
      {label}
    </button>
  );
}
