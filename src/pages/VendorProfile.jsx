import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MapPicker from "@/components/MapPicker";
import { Pill } from "lucide-react";

export default function VendorProfile({ vendor, products, onMessage, onAddToCart, goBack }) {
	const [text, setText] = useState("");
	if (!vendor) return <div>Vendor not found.</div>;
	return (
		<div className="space-y-4 font-poppins tracking-tighter">
			<Button variant="ghost" onClick={goBack} className="mb-2">← Back</Button>
			<Card>
				<CardContent className="p-4 space-y-3 font-poppins tracking-tighter">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 flex items-center gap-4">
							{/* DP */}
							<div className="flex flex-col items-center">
								{vendor.dp ? (
									<img
										src={vendor.dp}
										alt="Pharmacy DP"
										className="h-16 w-16 object-cover rounded-full"
									/>
								) : (
									<div className="h-16 w-16 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-300 bg-white">
										{/* Dummy profile icon SVG */}
										<svg
											width="32"
											height="32"
											viewBox="0 0 32 32"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle
												cx="16"
												cy="16"
												r="15"
												stroke="#cbd5e1"
												strokeWidth="2"
												fill="#f1f5f9"
											/>
											<circle cx="16" cy="13" r="5" fill="#cbd5e1" />
											<ellipse
												cx="16"
												cy="23"
												rx="7"
												ry="4"
												fill="#cbd5e1"
											/>
										</svg>
									</div>
								)}
							</div>
							<div>
								<div className="text-lg font-semibold tracking-tighter">
									{vendor.name}
								</div>
								<div className="text-sm text-slate-600 tracking-tighter">
									{vendor.bio}
								</div>
								<div className="text-xs text-slate-500 tracking-tighter">
									{vendor.address} • {vendor.contact}
								</div>
								{vendor.email && (
									<div className="text-xs text-slate-500 tracking-tighter">
										{vendor.email}
									</div>
								)}
							</div>
						</div>
						<Badge>{vendor.etaMins || 30} mins</Badge>
					</div>
					{/* Uploaded images gallery */}
					{Array.isArray(vendor.images) && vendor.images.length > 0 && (
						<div className="flex gap-2 mt-2">
							{vendor.images.map((img, idx) => (
								<img
									key={idx}
									src={img}
									alt={`Pharmacy ${idx + 1}`}
									className="h-16 w-16 object-cover rounded-md"
								/>
							))}
						</div>
					)}
					{typeof vendor.lat === "number" && typeof vendor.lng === "number" && (
						<MapPicker
							value={{ lat: vendor.lat, lng: vendor.lng }}
							readOnly
							height={200}
							zoom={14}
						/>
					)}
					<div className="flex gap-2 mt-2">
						<Input
							placeholder="Ask a question"
							value={text}
							onChange={(e) => setText(e.target.value)}
							className="font-poppins tracking-tighter"
						/>
						<Button
							onClick={() => {
								if (text.trim()) {
									onMessage(vendor.uid || vendor.id, text.trim());
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
							className="border-[1px] border-gray-200 rounded-[10px] overflow-hidden bg-gray-50"
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
