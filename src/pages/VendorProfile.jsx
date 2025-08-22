import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MapPicker from "@/components/MapPicker";
import { Pill } from "lucide-react";

export default function VendorProfile({ vendor, products, onMessage, onAddToCart }) {
	const [text, setText] = useState("");
	if (!vendor) return <div>Vendor not found.</div>;
	return (
		<div className="space-y-4 font-poppins tracking-tighter">
			<Card>
				<CardContent className="p-4 space-y-3 font-poppins tracking-tighter">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="text-lg font-semibold tracking-tighter">
								{vendor.name}
							</div>
							<div className="text-sm text-slate-600 tracking-tighter">
								{vendor.bio}
							</div>
							<div className="text-xs text-slate-500 tracking-tighter">
								{vendor.address} • {vendor.contact}
							</div>
						</div>
						<Badge>{vendor.etaMins || 30} mins</Badge>
					</div>
					{typeof vendor.lat === "number" && typeof vendor.lng === "number" && (
						<MapPicker
							value={{ lat: vendor.lat, lng: vendor.lng }}
							readOnly
							height={200}
							zoom={14}
						/>
					)}
					<div className="flex gap-2">
						<Input
							placeholder="Ask a question"
							value={text}
							onChange={(e) => setText(e.target.value)}
							className="font-poppins tracking-tighter"
						/>
						<Button
							onClick={() => {
								if (text.trim()) {
									onMessage(vendor.id, text.trim());
									setText("");
								}
							}}
							className="font-poppins tracking-tighter"
						>
							Send
						</Button>
					</div>
				</CardContent>
			</Card>

			<div>
				<h3 className="font-semibold mb-2 tracking-tighter">Products</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{products.map((p) => (
						<div
							key={p.id}
							className="border rounded-xl overflow-hidden font-poppins tracking-tighter"
						>
							<div className="aspect-square bg-slate-100 flex items-center justify-center">
								{p.image ? (
									<img
										src={p.image}
										alt={p.name}
										className="object-cover w-full h-full"
									/>
								) : (
									<Pill className="h-8 w-8 text-slate-400" />
								)}
							</div>
							<div className="p-3 font-poppins tracking-tighter">
								<div className="text-sm font-medium line-clamp-1 tracking-tighter">
									{p.name}
								</div>
								<div className="text-xs text-slate-500 tracking-tighter">
									₦{Number(p.price).toLocaleString()}
								</div>
								<div className="pt-2">
									<Button
										size="sm"
										className="w-full font-poppins tracking-tighter"
										onClick={() => onAddToCart(p.id)}
									>
										Add to cart
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
