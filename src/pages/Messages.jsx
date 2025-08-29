import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Store, Phone, Paperclip, X } from "lucide-react";
import SendIconRaw from "@/assets/icons/Send Button.svg?raw";
import { listenToConversations, listenToMessages, sendMessage, createConversation } from '@/lib/firebase-chat';

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

const SendIcon = () => (
  <span className="h-5 w-5" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SendIconRaw }} />
);

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

function QuotedMini({ q }) {
  if (!q) return null;
  return (
    <div className="mb-1 text-xs rounded-md bg-black/5 text-slate-700 border-l-2 border-slate-400 pl-2 pr-2 py-1">
      <div className="truncate max-w-[220px]">
        <span className="font-medium">{q.from === "me" ? "You" : "Them"}: </span>
        <span className="opacity-90">{q.text || "(attachment)"}</span>
      </div>
    </div>
  );
}

// Message status icons
const StatusTick = ({ status }) => {
  if (status === 'sending') {
    return (
      <svg className="inline w-4 h-4 animate-spin text-slate-400 ml-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" /></svg>
    );
  }
  if (status === 'sent') {
    return (
      <svg className="inline w-4 h-4 text-slate-400 ml-1" viewBox="0 0 20 20"><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg className="inline w-4 h-4 text-slate-400 ml-1" viewBox="0 0 20 20"><path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
  }
  if (status === 'read') {
    return (
      <svg className="inline w-4 h-4 text-sky-500 ml-1" viewBox="0 0 20 20"><path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
  }
  return null;
};

// Typing indicator state (simulate for demo)
function useTypingIndicator(partnerId, isActive) {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!isActive) return;
    let timeout;
    const handler = () => {
      setTyping(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setTyping(false), 2000);
    };
    window.addEventListener('PD_TYPING_'+partnerId, handler);
    return () => {
      window.removeEventListener('PD_TYPING_'+partnerId, handler);
      clearTimeout(timeout);
    };
  }, [partnerId, isActive]);
  return typing;
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
  const textareaRef = useRef(null);
  const [files, setFiles] = useState([]); // { id, file, url, name, type, size, kind }
  const [replyingTo, setReplyingTo] = useState(null); // {id, text, from, at}
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  // ---- Swipe-to-reply (with iOS-safe inner wrapper) ----
  const [dragId, setDragId] = useState(null);
  const [dragX, setDragX] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0, active: false });
  const SWIPE_TRIGGER = 56;
  const SWIPE_MAX = 72;
  const SWIPE_SLOPE = 0.6;

  const beginDrag = (x, y, msg) => {
    dragStartRef.current = { x, y, active: true };
    setDragId(msg.id);
    setDragX(0);
  };
  const updateDrag = (x, y) => {
    if (!dragStartRef.current.active) return;
    const dx = x - dragStartRef.current.x;
    const dy = Math.abs(y - dragStartRef.current.y);
    if (dx < 0 || dy > Math.abs(dx) * SWIPE_SLOPE) {
      setDragX(0);
      return;
    }
    setDragX(Math.min(dx, SWIPE_MAX));
  };
  const endDrag = (msg) => {
    if (!dragStartRef.current.active) return;
    dragStartRef.current.active = false;
    const shouldReply = dragX >= SWIPE_TRIGGER;
    // reset transform fully before state update (iOS layout quirk)
    setDragId(null);
    setDragX(0);
    if (shouldReply) setReplyingTo({ id: msg.id, text: msg.text, from: msg.from, at: msg.at });
  };

  const onTouchStart = (e, msg) => {
    const t = e.touches?.[0]; if (!t) return;
    beginDrag(t.clientX, t.clientY, msg);
  };
  const onTouchMove = (e) => {
    const t = e.touches?.[0]; if (!t) return;
    updateDrag(t.clientX, t.clientY);
  };
  const onTouchEnd = (msg) => endDrag(msg);

  const onMouseDown = (e, msg) => {
    beginDrag(e.clientX, e.clientY, msg);
    const move = (ev) => updateDrag(ev.clientX, ev.clientY);
    const up = () => {
      endDrag(msg);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Lock page scroll while thread is open
  useEffect(() => {
    onActiveChange?.(true);
    const html = document.documentElement, body = document.body;
    const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, htmlOverscroll: html.style.overscrollBehavior };
    html.style.overflow = "hidden"; html.style.overscrollBehavior = "contain"; body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev.htmlOverflow || "";
      html.style.overscrollBehavior = prev.htmlOverscroll || "";
      body.style.overflow = prev.bodyOverflow || "";
      onActiveChange?.(false);
    };
  }, [onActiveChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phone = isVendorKnown && typeof resolvePhone === "function" ? resolvePhone(partnerId) : "";

  const pickFiles = () => fileInputRef.current?.click();
  const onChooseFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const next = list.map((f) => {
      const isImg = f.type.startsWith("image/");
      const url = URL.createObjectURL(f);
      return {
        id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2)}`,
        file: f,
        url,
        name: f.name,
        type: f.type,
        size: f.size,
        kind: isImg ? "image" : "file",
      };
    });
    setFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  };
  const removeFile = (id) =>
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter((x) => x.id !== id);
    });

  // Reset textarea height after send
  const sendNow = () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    const atts = files.map((a) => ({ name: a.name, type: a.type, size: a.size, url: a.url, kind: a.kind }));
    onSend(
      partnerId,
      trimmed,
      atts,
      replyingTo ? { id: replyingTo.id, text: replyingTo.text, from: replyingTo.from, at: replyingTo.at } : null
    );
    setText("");
    setFiles([]);
    setReplyingTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.transition = 'height 0.18s cubic-bezier(.4,0,.2,1)';
      textareaRef.current.style.height = '36px';
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const canSend = text.trim().length > 0 || files.length > 0;
  const typing = useTypingIndicator(partnerId, true);

  // Send typing event (simulate, real app would use websocket)
  const onInput = (e) => {
    setText(e.target.value);
    if (e.target.value.length > 0) {
      window.dispatchEvent(new Event('PD_TYPING_'+partnerId));
    }
  };

  // Emoji picker (native)
  const onEmoji = () => {
    if (navigator.userAgent.includes('Mac')) {
      alert('Press Control + Command + Space to open emoji picker.');
    } else {
      alert('Use your OS emoji picker.');
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#F0F0F0] bg-[#FFFFFF] backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-black">
          <ArrowLeft className="h-5 w-5 text-black" />
        </Button>
        <h3 className="font-semibold flex-1 truncate text-black">{partnerName}</h3>
        {/* Remove View Store for pharmacists */}
        {isVendorKnown && typeof onOpenVendor === "function" && window?.PD_APP_ROLE !== "pharmacist" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenVendor(partnerId)}
            className="inline-flex items-center gap-1 text-black px-2 py-1 text-[11px] font-poppins"
            style={{ minHeight: "28px", height: "28px" }}
          >
            <Store className="h-3 w-3 text-black" />
            View store
          </Button>
        )}
        {isVendorKnown && phone && (
          <Button
            as="a"
            href={`tel:${phone}`}
            size="sm"
            className="inline-flex items-center gap-1 bg-blue text-white px-2 py-1 text-[11px] font-poppins"
            style={{ minHeight: "28px", height: "28px" }}
          >
            <Phone className="h-3 w-3" />
            Call to order
          </Button>
        )}
      </div>
      {/* Messages area */}
      <div
        className="overflow-y-auto overscroll-contain px-4 py-2 bg-cover bg-center font-poppins text-[12px]"
        style={{ backgroundImage: "url('/Background-Watermark.png')" }}
        onTouchMove={onTouchMove}
      >
        {thread.length === 0 ? (
          <div className="text-slate-400 text-center mt-8">No messages yet.</div>
        ) : (
          thread.map((msg, i) => {
            const mine = msg.from === "me";
            const thisDate = new Date(msg.at || 0);
            const prev = thread[i - 1];
            const needDateStamp = i === 0 || !isSameDay(thisDate, new Date(prev?.at || 0));
            const isDragging = dragId === msg.id;
            const translate = isDragging ? dragX : 0;
            return (
              <React.Fragment key={msg.id}>
                {needDateStamp && (
                  <div className="my-3 flex justify-center">
                    <span className="text-[11px] px-3 py-1 rounded-full bg-black/10 text-slate-700">
                      {dayLabel(thisDate)}
                    </span>
                  </div>
                )}
                <div className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] min-w-0 relative" style={{ backfaceVisibility: "hidden" }}>
                    <div
                      className="relative drag-wrap transform-gpu will-change-transform select-none"
                      onTouchStart={(e) => onTouchStart(e, msg)}
                      onTouchEnd={() => onTouchEnd(msg)}
                      onMouseDown={(e) => onMouseDown(e, msg)}
                      style={{
                        WebkitTransform: `translate3d(${translate}px,0,0)`,
                        transform: `translate3d(${translate}px,0,0)`,
                        transition: isDragging ? "none" : "transform 120ms ease-out",
                        willChange: "transform",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      {isDragging && translate > 12 && (
                        <div className="absolute -left-7 top-1/2 -translate-y-1/2 rounded-full w-6 h-6 bg-slate-800/80 text-white flex items-center justify-center">
                          ↩
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 text-[12px] leading-snug break-words shadow ${
                          mine ? "bg-[#000000] text-white rounded-lg rounded-br-none" : "bg-white text-black rounded-lg rounded-bl-none"
                        }`}
                      >
                        <QuotedMini q={msg.replyTo} />
                        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div
                            className={`mb-2 grid gap-2 ${
                              msg.attachments.filter((a) => a.kind === "image").length > 1 ? "grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            {msg.attachments.map((a, idx) =>
                              a.kind === "image" ? (
                                <a key={idx} href={a.url} target="_blank" rel="noreferrer">
                                  <img src={a.url} alt={a.name || "image"} className="w-full h-40 object-cover rounded-xl" />
                                </a>
                              ) : (
                                <a
                                  key={idx}
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`px-3 py-2 rounded-lg text-xs ${
                                    mine ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {a.name || "attachment"}
                                </a>
                              )
                            )}
                          </div>
                        )}
                        {msg.text}
                      </div>
                      {msg.at && (
                        <div className={`mt-1 text-[10px] text-slate-400 ${mine ? "text-right" : "text-left"}`}>
                          {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {mine && <StatusTick status={msg.status || 'sent'} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        {typing && !text && (
          <div className="px-4 pb-2 text-xs text-slate-500 font-poppins animate-pulse">{partnerName} is typing…</div>
        )}
        <div ref={endRef} />
      </div>
      {/* Composer */}
      <div
        className="px-4 py-2 bg-white border-t border-[#F0F0F0]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
      >
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 border pl-3 pr-2 py-2">
            <div className="min-w-0 text-xs">
              <div className="font-medium text-slate-700 mb-0.5">
                Replying to {replyingTo.from === "me" ? "you" : "them"}
              </div>
              <div className="truncate text-slate-600 max-w-[75vw]">
                {replyingTo.text || "(attachment)"}
              </div>
            </div>
            <button
              className="ml-3 rounded-full p-1 hover:bg-slate-200"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        )}
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
          <Button type="button" variant="ghost" size="icon" onClick={pickFiles} className="rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-md font-poppins text-[12px] size-sm resize-none min-h-[36px] max-h-[120px] py-2 px-3 border border-slate-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 transition-all duration-200"
            value={text}
            onChange={onInput}
            placeholder="Message"
            rows={1}
            style={{ overflow: 'hidden', borderRadius: '6px' }}
            onInput={e => {
              e.target.style.transition = 'height 0.18s cubic-bezier(.4,0,.2,1)';
              e.target.style.height = 'auto';
              if (e.target.value.length === 0) {
                e.target.style.height = '36px';
              } else {
                e.target.style.height = e.target.scrollHeight + 'px';
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendNow();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full p-2 hover:bg-transparent disabled:opacity-40"
            onClick={sendNow}
            disabled={!canSend}
            aria-label="Send message"
            title="Send"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Messages({
  vendors = [],
  threads = {},
  onOpenVendor,
  resolvePhone,
  onActiveThreadChange,
  lastSeenAt = 0,
  me,
}) {
  // IMPORTANT: map by uid || id so both work
  const vendorById = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.uid || v.id, v])),
    [vendors]
  );

  const [search, setSearch] = useState("");
  // Simulate online status: random online for demo
  const onlineMap = useMemo(() => {
    const map = {};
    Object.keys(threads).forEach((id, i) => {
      map[id] = i % 2 === 0; // alternate online/offline
    });
    return map;
  }, [threads]);

  // Track unread per chat
  const [openedChats, setOpenedChats] = useState({});
  const conversations = useMemo(() => {
    const items = Object.entries(threads).map(([partnerId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const partnerVendor = vendorById[partnerId];
      const partnerName = partnerVendor ? partnerVendor.name : `Customer ${String(partnerId).slice(0, 6)}`;
      const lastAt = last?.at ? new Date(last.at).getTime() : 0;
      const lastPreview =
        last?.text ||
        (last?.attachments?.length ? `${last.attachments.length} attachment${last.attachments.length > 1 ? "s" : ""}` : "No messages yet");
      // Unread: only count if chat not opened
      let unread = 0;
      if (!openedChats[partnerId]) {
        unread = msgs.reduce((acc, m) => {
          const t = m.at ? new Date(m.at).getTime() : 0;
          return acc + (m.from === "them" && t > lastSeenAt ? 1 : 0);
        }, 0);
      }
      return { partnerId, partnerName, isVendorKnown: !!partnerVendor, lastAt, lastPreview, unread, count: msgs.length };
    });
    return items.sort((a, b) => b.lastAt - a.lastAt);
  }, [threads, vendorById, lastSeenAt, openedChats]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (c.partnerName.toLowerCase().includes(q)) return true;
      // Also search messages in the thread
      const msgs = threads[c.partnerId] || [];
      return msgs.some(m => (m.text || '').toLowerCase().includes(q));
    });
  }, [conversations, search, threads]);

  // Firestore chat state
  const [fsConversations, setFsConversations] = useState([]);
  const [fsThreads, setFsThreads] = useState({});
  useEffect(() => {
    if (!me?.id || !me?.role) return;
    const unsub = listenToConversations(me.id, me.role, setFsConversations);
    return unsub;
  }, [me]);
  useEffect(() => {
    // Listen to messages for each conversation
    const unsubs = [];
    fsConversations.forEach(conv => {
      unsubs.push(listenToMessages(conv.id, msgs => {
        setFsThreads(prev => ({ ...prev, [conv.id]: msgs }));
      }));
    });
    return () => unsubs.forEach(fn => fn());
  }, [fsConversations]);

  // Use Firestore threads if available
  const threadsToUse = Object.keys(fsThreads).length ? fsThreads : threads;

  // Handler to send a message using Firestore, creating conversation if needed
  const handleSend = async (partnerId, text, attachments, replyTo) => {
    let conv = fsConversations.find(c => c.customerId === partnerId || c.vendorId === partnerId);
    // If no conversation exists, create one
    if (!conv) {
      const fromRole = me?.role === 'pharmacist' ? 'vendor' : 'customer';
      const data = me?.role === 'pharmacist'
        ? { vendorId: me.uid || me.id, customerId: partnerId }
        : { vendorId: partnerId, customerId: me.uid || me.id };
      const convId = await createConversation(data);
      conv = { id: convId, ...data };
      setFsConversations(prev => [...prev, conv]);
    }
    await sendMessage(conv.id, {
      from: me?.role === 'pharmacist' ? 'vendor' : 'customer',
      text,
      attachments,
      replyTo,
    });
  };

  if (conversations.length === 0) {
    return <EmptyState title="No Chats" body="Start an enquiry from a product or vendor page to begin." />;
  }

  const [activePartnerId, setActivePartnerId] = useState(null);
  const activeThread = activePartnerId ? threadsToUse[activePartnerId] || [] : [];
  const activePartnerVendor = activePartnerId ? vendorById[activePartnerId] : null;

  // Mark chat as opened (reset unread) when opened
  useEffect(() => {
    if (activePartnerId) {
      setOpenedChats((prev) => ({ ...prev, [activePartnerId]: true }));
    }
  }, [activePartnerId]);

  if (activePartnerId) {
    return (
      <ChatThreadScreen
        partnerId={activePartnerId}
        partnerName={activePartnerVendor ? activePartnerVendor.name : `Customer ${String(activePartnerId).slice(0, 6)}`}
        isVendorKnown={!!activePartnerVendor}
        onOpenVendor={onOpenVendor}
        thread={activeThread}
        onSend={handleSend}
        onBack={() => setActivePartnerId(null)}
        resolvePhone={resolvePhone}
        onActiveChange={onActiveThreadChange}
      />
    );
  }

  return (
    <div className="h-[70vh]">
      <h2 className="text-[25px] font-black tracking-tight mb-3 font-poppins">My Messages</h2>
      <Input
        className="mb-3"
        placeholder="Search customers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(70vh - 2rem)" }}>
        {filteredConversations.map((c) => (
          <Card key={c.partnerId} className="cursor-pointer" onClick={() => setActivePartnerId(c.partnerId)}>
            <CardContent className="p-3 flex items-center justify-between font-poppins">
              <div className="flex items-center min-w-0 gap-2">
                {/* Avatar removed. Only show name and preview */}
                <div className="min-w-0">
                  <div className={`font-medium text-sm truncate ${onlineMap[c.partnerId] ? 'text-sky-600' : ''}`}>{c.partnerName}</div>
                  <div className="text-xs text-slate-500 truncate">{c.lastPreview}</div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-[10px] text-slate-400">
                  {c.lastAt ? new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                {c.unread > 0 && (
                  <div className="mt-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold">
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
