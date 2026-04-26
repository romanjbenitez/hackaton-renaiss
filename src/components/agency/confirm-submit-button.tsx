"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  confirmMessage: string;
};

function InnerButton({ children, className, confirmMessage }: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={cn(className)}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}

export function ConfirmSubmitButton(props: ConfirmSubmitButtonProps) {
  return <InnerButton {...props} />;
}
