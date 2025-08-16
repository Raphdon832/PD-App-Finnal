import React from "react"

export function Button({ as: Comp = "button", className="", variant="default", size="md", ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition border";
  const variants = {
    default: "bg-slate-900 text-white border-slate-900 hover:opacity-90",
    outline: "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent border-transparent hover:bg-slate-100",
  };
  const sizes = { sm:"h-8 px-2 text-xs", md:"h-9", lg:"h-10 text-base", icon:"h-9 w-9 p-0" };
  const cls = [base, variants[variant]||variants.default, sizes[size]||sizes.md, className].join(" ");
  return <Comp className={cls} {...props} />;
}
