import React from "react"

export function Button({
  as: Comp = "button",
  className = "",
  variant = "default",
  size = "md",
  radius = "sm",               // ← new: control border radius per button
  ...props
}) {
  // removed hardcoded rounded-* from base so radius can be customized
  const base =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition border";

  const variants = {
    default: "bg-slate-900 text-white border-slate-900 hover:opacity-90",
    outline: "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent border-transparent hover:bg-slate-100",
  };

  const sizes = {
    sm: "h-8 px-2 text-xs",
    md: "h-9",
    lg: "h-10 text-base",
    icon: "h-9 w-9 p-0",
  };

  // map simple radius keywords to Tailwind classes; also accept a full class like "rounded-[14px]"
  const radii = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };
  const radiusClass =
    typeof radius === "string" && radius.includes("rounded")
      ? radius
      : radii[radius] || radii.xl;

  // className last so it can still override anything
  const cls = [
    base,
    radiusClass,
    variants[variant] || variants.default,
    sizes[size] || sizes.md,
    className,
  ].join(" ");

  return <Comp className={cls} {...props} />;
}
