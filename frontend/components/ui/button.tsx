import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "quiet";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center rounded-sm px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-paper hover:bg-accent",
        variant === "outline" && "border border-line bg-transparent text-ink hover:border-ink",
        variant === "quiet" && "bg-transparent text-ink hover:text-accent",
        className
      )}
      {...props}
    />
  );
}

