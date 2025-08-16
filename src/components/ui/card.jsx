import React from "react"
export function Card({ className="", ...props }) {
  return <div className={"bg-white rounded-2xl border border-slate-200 "+className} {...props} />
}
export function CardHeader({ className="", ...p }) {
  return <div className={"p-4 border-b border-slate-100 "+className} {...p} />
}
export function CardTitle({ className="", ...p }) {
  return <h3 className={"font-semibold "+className} {...p} />
}
export function CardDescription({ className="", ...p }) {
  return <p className={"text-sm text-slate-600 "+className} {...p} />
}
export function CardContent({ className="", ...p }) {
  return <div className={"p-4 "+className} {...p} />
}
