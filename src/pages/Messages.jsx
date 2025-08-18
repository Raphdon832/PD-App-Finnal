// src/pages/Messages.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Phone } from "lucide-react";

function normalizePhone(v) {
  return (v || "").toString().replace(/[^\d+]/g, "").replace(/^00/, "+");
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

function QuickMessage({ vendors, onSend }) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [text, setText] = useState("");
  return (
    <div className="flex gap-2">
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={vendorId}
        onChange={(e) => setVendorId(e.target.value)}
      >
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <Input
        className="flex-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
      />
      <Button
        type="button"
        onClick={() => {
          if (text.trim() && vendorId) {
            onSend(vendorId, text.trim());
            setText("");
          }
        }}
      >
        Send
      </Button>
    </div>
  );
}

function ChatThreadScreen({ vendor, thread, onSend, onBack }) {
  const [text, setText] = useState("");

  const tel = normalizePhone(vendor?.phone || vendor?.contact || vendor?.tel);
  const canCall = Boolean(tel);

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold ml-2">{vendor.name}</h3>
        </div>
        {canCall && (
          <a href={`tel:${tel}`}>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Call to order
            </Button>
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-2 border rounded p-2 bg-slate-50">
        {thread.length === 0 ? (
          <div className="text-slate-400 text-center mt-8">No messages yet.</div>
        ) : (
          thread.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex ${
                msg.from === "customer" || msg.from === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  msg.from === "customer" || msg.from === "me"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          className="flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onSend(vendor.id, text.trim());
              setText("");
            }
          }}
        />
        <Button
          type="button"
          onClick={() => {
            if (text.trim()) {
              onSend(vendor.id, text.trim());
              setText("");
            }
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export default function Messages({ vendors = [] }) {
  const [threads, setThreads] = useState({});
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const handleSend = (vendorId, text) => {
    setThreads((prev) => ({
      ...prev,
      [vendorId]: [
        ...(prev[vendorId] || []),
        { from: "customer", text, timestamp: Date.now() },
      ],
    }));
  };

  const handleOpenVendor = (vendorId) => {
    setSelectedVendorId(vendorId);
  };

  const handleBack = () => {
    setSelectedVendorId(null);
  };

  if (!vendors.length) {
    return (
      <EmptyState
        title="No pharmacies yet"
        body="Once pharmacies appear here, you can open a thread or send a quick message."
      />
    );
    }

  const selectedVendor =
    vendors.find((v) => v.id === selectedVendorId) || null;

  if (selectedVendor) {
    return (
      <ChatThreadScreen
        vendor={selectedVendor}
        thread={threads[selectedVendor.id] || []}
        onSend={handleSend}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 h-[70vh]">
      <div className="space-y-2">
        <h3 className="font-semibold">Conversations</h3>
        {vendors.map((v) => {
          const last = threads[v.id]?.slice(-1)[0]?.text || "No messages yet";
          return (
            <Card
              key={v.id}
              className="cursor-pointer"
              onClick={() => handleOpenVendor(v.id)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{last}</div>
                </div>
                <MessageSquare className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="space-y-2 h-full flex flex-col">
        <h3 className="font-semibold">Quick message</h3>
        <QuickMessage vendors={vendors} onSend={handleSend} />
        <div className="text-xs text-slate-500">Open a vendor to view the full thread.</div>
      </div>
    </div>
  );
}
