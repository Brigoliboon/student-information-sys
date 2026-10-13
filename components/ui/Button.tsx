import type { ReactNode } from "react";

interface ButtonProps {
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50",
  ghost: "text-indigo-700 hover:bg-indigo-50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500",
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-[13px] rounded-full",
  md: "h-10 px-5 text-sm rounded-full",
  lg: "h-11 px-6 text-sm rounded-full",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  children,
  onClick,
  type = "button",
  disabled,
}: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-60 ${variants[variant]} ${sizes[size]}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
