import React from "react"
export function Textarea({ className="", ...props }) {
  return <textarea className={"min-h-[96px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 "+className} {...props} />
}
