import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "quiet";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-accent text-white hover:bg-blue-700",
        variant === "outline" && "border border-line bg-paper text-ink hover:bg-paper-50",
        variant === "quiet" && "bg-transparent text-muted hover:bg-paper-50 hover:text-ink",
        className
      )}
      {...props}
    />
  );
}
