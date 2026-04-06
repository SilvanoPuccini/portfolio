import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export default function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg px-6 py-3 font-semibold transition",
        variant === "primary"
          ? "bg-primary text-black hover:opacity-90"
          : "border border-white/20 text-white hover:border-white/40",
        className,
      )}
      {...props}
    />
  );
}
