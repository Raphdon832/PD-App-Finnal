import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Store, Phone, Paperclip, X } from "lucide-react";

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayLabel(d) {
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function EmptyState({ title, body }) {
  return (
    <div className="max-w-md mx-auto text-center p-8 border rounded-2xl bg-white">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <MessageSquare className="h-6 w-6 text-slate-400" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-slate-600">{body}</div>
    </div>
  );
}

function ChatThreadScreen({
  partnerId,
  partnerName,
  isVendorKnown,
  onOpenVendor,
  thread = [],
  onSend,
  onBack,
  resolvePhone,
  onActiveChange,
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // { id, file, url, name, type, size, kind: 'image'|'file' }
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  // Lock page scroll while thread is open
  useEffect(() => {
    onActiveChange?.(true);
    const html = document.documentElement, body = document.body;
    const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, htmlOverscroll: html.style.overscrollBehavior };
    html.style.overflow = "hidden"; html.style.overscrollBehavior = "contain"; body.style.overflow = "hidden";
    return () => { html.style.overflow = prev.htmlOverflow || ""; html.style.overscrollBehavior = prev.htmlOverscroll || ""; body.style.overflow = prev.bodyOverflow || ""; onActiveChange?.(false); };
  }, [onActiveChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  const phone = isVendorKnown && typeof resolvePhone === "function" ? resolvePhone(partnerId) : "";

  const pickFiles = () => fileInputRef.current?.click();
  const onChooseFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const next = list.map((f) => {
      const isImg = f.type.startsWith("image/");
      const url = URL.createObjectURL(f);
      return { id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2)}`, file: f, url, name: f.name, type: f.type, size: f.size, kind: isImg ? "image" : "file" };
    });
    setFiles((prev) => [...prev, ...next]);
    e.target.value = ""; // allow picking same file again
  };
  const removeFile = (id) => setFiles((prev) => prev.filter((x) => x.id !== id));

  const sendNow = () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    // Minimal metadata to store; object URLs are fine for prototype/local
    const atts = files.map((a) => ({ name: a.name, type: a.type, size: a.size, url: a.url, kind: a.kind }));
    onSend(partnerId, trimmed, atts);
    setText("");
    setFiles([]);
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-[100dvh] overflow-hidden">
      {/* Header (tweak your colors as needed) */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#F0F0F0] bg-[#FFFFFF] backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-black">
          <ArrowLeft className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-semibold flex-1 truncate text-black">{partnerName}</h3>

        {isVendorKnown && typeof onOpenVendor === "function" && (
          <Button variant="ghost" size="sm" onClick={() => onOpenVendor(partnerId)} className="inline-flex items-center gap-1 text-black">
            <Store className="h-4 w-4 text-black" />
            View store
          </Button>
        )}

        {isVendorKnown && phone && (
          <Button as="a" href={`tel:${phone}`} size="sm" className="inline-flex items-center gap-1 bg-blue text-white">
            <Phone className="h-4 w-4" />
            Call to order
          </Button>
        )}
      </div>

      {/* Messages area with date stamps + attachments */}
      <div
        className="overflow-y-auto overscroll-contain px-4 py-2 bg-cover bg-center"
        style={{ backgroundImage: "url('/Background-Watermark.png')" }}
      >
        {thread.length === 0 ? (
          <div className="text-slate-400 text-center mt-8">No messages yet.</div>
        ) : (
          thread.map((msg, i) => {
            const mine = msg.from === "me";
            const thisDate = new Date(msg.at || 0);
            const prev = thread[i - 1];
            const needDateStamp = i === 0 || !isSameDay(thisDate, new Date(prev?.at || 0));

            return (
              <React.Fragment key={msg.id}>
                {needDateStamp && (
                  <div className="my-3 flex justify-center">
                    <span className="text-[11px] px-3 py-1 rounded-full bg-black/10 text-slate-700">{dayLabel(thisDate)}</span>
                  </div>
                )}

                <div className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    {/* Bubble */}
                    <div className={`px-3 py-2 text-sm leading-snug break-words shadow ${
    mine
      ? "bg-[#000000] text-white rounded-lg rounded-br-none"  // mine
      : "bg-white text-black rounded-lg rounded-bl-none"      // theirs
  }`}>
                      {/* Attachments (if any) */}
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className={`mb-2 grid gap-2 ${msg.attachments.filter(a=>a.kind==="image").length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {msg.attachments.map((a, idx) =>
                            a.kind === "image" ? (
                              <a key={idx} href={a.url} target="_blank" rel="noreferrer">
                                <img src={a.url} alt={a.name || "image"} className="w-full h-40 object-cover rounded-xl" />
                              </a>
                            ) : (
                              <a key={idx} href={a.url} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded-lg text-xs ${mine ? "bg-white/20 text-white" : "bg-white text-slate-700"}`}>
                                {a.name || "attachment"}
                              </a>
                            )
                          )}
                        </div>
                      )}
                      {/* Text (if present) */}
                      {msg.text}
                    </div>

                    {/* Time */}
                    {msg.at && (
                      <div className={`mt-1 text-[10px] text-slate-400 ${mine ? "text-right" : "text-left"}`}>
                        {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="px-4 py-2 bg-white border-t border-[#F0F0F0]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}>
        {/* Previews row (if any files selected) */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f) =>
              f.kind === "image" ? (
                <div key={f.id} className="relative">
                  <img src={f.url} alt={f.name} className="h-16 w-16 object-cover rounded-xl border" />
                  <button
                    onClick={() => removeFile(f.id)}
                    className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div key={f.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border text-xs">
                  <span className="truncate max-w-[140px]">{f.name}</span>
                  <button onClick={() => removeFile(f.id)} aria-label="Remove" className="text-slate-500 hover:text-slate-700">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Paperclip */}
          <Button type="button" variant="ghost" size="icon" onClick={pickFiles} className="rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={onChooseFiles}
          />

          {/* Text input */}
          <Input
            className="flex-1 rounded-2xl"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendNow();
            }}
          />

          {/* Send */}
          <Button type="button" className="rounded-2xl" onClick={sendNow}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Messages({
  vendors = [],
  threads = {},
  onSend,
  onOpenVendor,
  resolvePhone,
  onActiveThreadChange,
  lastSeenAt = 0,
}) {
  const vendorById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])), [vendors]);

  const conversations = useMemo(() => {
    const items = Object.entries(threads).map(([partnerId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const partnerVendor = vendorById[partnerId];
      const partnerName = partnerVendor ? partnerVendor.name : `Customer ${String(partnerId).slice(0, 6)}`;
      const lastAt = last?.at ? new Date(last.at).getTime() : 0;
      const lastPreview = last?.text || (last?.attachments?.length ? `${last.attachments.length} attachment${last.attachments.length>1?"s":""}` : "No messages yet");

      // unread count (only messages from "them" after lastSeenAt)
      const unread = msgs.reduce((acc, m) => {
        const t = m.at ? new Date(m.at).getTime() : 0;
        return acc + (m.from === "them" && t > lastSeenAt ? 1 : 0);
      }, 0);

      return { partnerId, partnerName, isVendorKnown: !!partnerVendor, lastAt, lastPreview, unread, count: msgs.length };
    });
    return items.sort((a, b) => b.lastAt - a.lastAt);
  }, [threads, vendorById, lastSeenAt]);

  if (conversations.length === 0) {
    return <EmptyState title="No Chats" body="Start an enquiry from a product or vendor page to begin." />;
  }

  const [activePartnerId, setActivePartnerId] = useState(null);
  const activeThread = activePartnerId ? threads[activePartnerId] || [] : [];
  const activePartnerVendor = activePartnerId ? vendorById[activePartnerId] : null;

  if (activePartnerId) {
    return (
      <ChatThreadScreen
        partnerId={activePartnerId}
        partnerName={activePartnerVendor ? activePartnerVendor.name : `Customer ${String(activePartnerId).slice(0, 6)}`}
        isVendorKnown={!!activePartnerVendor}
        onOpenVendor={onOpenVendor}
        thread={activeThread}
        onSend={onSend}
        onBack={() => setActivePartnerId(null)}
        resolvePhone={resolvePhone}
        onActiveChange={onActiveThreadChange}
      />
    );
  }

  return (
    <div className="h-[70vh]">
      <h2 className="text-xl font-bold tracking-wide mb-3 uppercase">Conversations</h2>
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(70vh - 2rem)" }}>
        {conversations.map((c) => (
          <Card key={c.partnerId} className="cursor-pointer" onClick={() => setActivePartnerId(c.partnerId)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{c.partnerName}</div>
                <div className="text-xs text-slate-500 truncate">{c.lastPreview}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-[10px] text-slate-400">
                  {c.lastAt ? new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                {c.unread > 0 && (
                  <div className="mt-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-sky-600 text-white text-[10px] font-semibold">
                    {c.unread > 99 ? "99+" : c.unread}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}