/* FILE: src/components/EmptyState.jsx */
export default function EmptyState({ title, body, icon }){
  return (
    <div className="max-w-md mx-auto text-center p-8 border rounded-2xl bg-white">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-slate-600">{body}</div>
    </div>
  );
}