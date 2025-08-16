// src/pages/Messages.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

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

export default function Messages({ vendors = [], threads = {}, onOpenVendor, onSend }) {
  if (!vendors.length) {
    return (
      <EmptyState
        title="No pharmacies yet"
        body="Once pharmacies appear here, you can open a thread or send a quick message."
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Conversations</h3>
        {vendors.map((v) => {
          const last = threads[v.id]?.slice(-1)[0]?.text || "No messages yet";
          return (
            <Card key={v.id} className="cursor-pointer" onClick={() => onOpenVendor(v.id)}>
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

      <div className="space-y-2">
        <h3 className="font-semibold">Quick message</h3>
        <QuickMessage vendors={vendors} onSend={onSend} />
        <div className="text-xs text-slate-500">Open a vendor to view the full thread.</div>
      </div>
    </div>
  );
}
// This code defines a Messages component for a pharmacy delivery app.
// It allows users to view conversations with pharmacies, send quick messages, and manage their threads.
// The component includes an empty state when no pharmacies are available, a list of conversations,
// and a quick message input for sending messages to pharmacies.