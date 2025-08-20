// src/pages/Messages.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Store, Phone } from "lucide-react";

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
  onActiveThreadChange, // NEW
}) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Let App know a thread is active (to hide bottom navbar)
  useEffect(() => {
    onActiveThreadChange?.(true);
    return () => onActiveThreadChange?.(false);
  }, [onActiveThreadChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  const phone =
    isVendorKnown && typeof resolvePhone === "function"
      ? resolvePhone(partnerId)
      : "";

  return (
    <div className="flex flex-col h-[100svh]">
      {/* Chat-specific top bar (acts like its own navbar) */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold flex-1 truncate">{partnerName}</h3>

          {isVendorKnown && typeof onOpenVendor === "function" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenVendor(partnerId)}
              className="inline-flex items-center gap-1"
            >
              <Store className="h-4 w-4" />
              View store
            </Button>
          )}

          {isVendorKnown && phone && (
            <Button
              as="a"
              href={`tel:${phone}`}
              size="sm"
              className="inline-flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              Call to order
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 bg-transparent">
        {thread.length === 0 ? (
          <div className="text-slate-400 text-center mt-8">No messages yet.</div>
        ) : (
          thread.map((msg) => {
            const mine = msg.from === "me";
            return (
              <div
                key={msg.id}
                className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  <div className="px-4 py-3 rounded-2xl text-sm leading-snug break-words bg-black text-white">
                    {msg.text}
                  </div>
                  {msg.at && (
                    <div
                      className={`mt-1 text-[10px] text-slate-400 ${
                        mine ? "text-right" : "text-left"
                      }`}
                    >
                      {new Date(msg.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar pinned at bottom (safe-area aware) */}
      <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 rounded-2xl"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                onSend(partnerId, text.trim());
                setText("");
              }
            }}
          />
          <Button
            type="button"
            className="rounded-2xl"
            onClick={() => {
              if (text.trim()) {
                onSend(partnerId, text.trim());
                setText("");
              }
            }}
          >
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
  onActiveThreadChange, // NEW
}) {
  const vendorById = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors]
  );

  const conversations = useMemo(() => {
    const items = Object.entries(threads).map(([partnerId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const partnerVendor = vendorById[partnerId];
      const partnerName = partnerVendor
        ? partnerVendor.name
        : `Customer ${String(partnerId).slice(0, 6)}`;
      const lastAt = last?.at ? new Date(last.at).getTime() : 0;
      const lastPreview = last?.text || "No messages yet";
      return {
        partnerId,
        partnerName,
        isVendorKnown: !!partnerVendor,
        lastAt,
        lastPreview,
        count: msgs.length,
      };
    });
    return items.sort((a, b) => b.lastAt - a.lastAt);
  }, [threads, vendorById]);

  const [activePartnerId, setActivePartnerId] = useState(null);

  // Ensure the bottom nav shows when not inside a thread
  useEffect(() => {
    if (!activePartnerId) onActiveThreadChange?.(false);
  }, [activePartnerId, onActiveThreadChange]);

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No Chats"
        body="Start an enquiry from a product or vendor page to begin."
      />
    );
  }

  const activeThread = activePartnerId ? threads[activePartnerId] || [] : [];
  const activePartnerVendor = activePartnerId
    ? vendorById[activePartnerId]
    : null;

  if (activePartnerId) {
    return (
      <ChatThreadScreen
        partnerId={activePartnerId}
        partnerName={
          activePartnerVendor
            ? activePartnerVendor.name
            : `Customer ${String(activePartnerId).slice(0, 6)}`
        }
        isVendorKnown={!!activePartnerVendor}
        onOpenVendor={onOpenVendor}
        thread={activeThread}
        onSend={onSend}
        onBack={() => setActivePartnerId(null)}
        resolvePhone={resolvePhone}
        onActiveThreadChange={onActiveThreadChange} // pass down
      />
    );
  }

  return (
    <div className="h-[70vh]">
      <h3 className="font-semibold mb-3">Conversations</h3>
      <div
        className="space-y-2 overflow-y-auto pr-1"
        style={{ maxHeight: "calc(70vh - 2rem)" }}
      >
        {conversations.map((c) => (
          <Card
            key={c.partnerId}
            className="cursor-pointer"
            onClick={() => setActivePartnerId(c.partnerId)}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">
                  {c.partnerName}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {c.lastPreview}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                {c.lastAt ? (
                  <div className="text-[10px] text-slate-400">
                    {new Date(c.lastAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">—</div>
                )}
                {c.count > 0 && (
                  <div className="mt-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-200 text-[10px]">
                    {c.count}
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
