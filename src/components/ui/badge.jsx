import React from "react"
export function Badge({ className="", variant="default", ...props }) {
  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-900",
  };
  return <span className={"inline-flex items-center rounded-full px-3 py-1 text-xs font-medium "+(variants[variant]||variants.default)+" "+className} {...props} />
}
