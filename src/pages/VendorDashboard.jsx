import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Pill } from "lucide-react";

const CATEGORIES = [
	"Prescription Drugs",
	"Over-the-Counter",
	"Controlled Substances",
	"Therapeutic",
	"Syrup",
	"Target System",
];

const currency = (n) =>
	`₦${Number(n || 0).toLocaleString(undefined, {
		maximumFractionDigits: 2,
	})}`;

export default function VendorDashboard({
	me,
	products, // vendor-scoped list from App.jsx
	myVendor,
	upsertVendor,
	addProduct,
	removeProduct,
	importFiles,
	vendorId: vendorIdFromParent, // auth.uid from App.jsx
}) {
	const [form, setForm] = useState({
		name: "",
		price: "",
		stock: "",
		image: "",
		category: "Therapeutic",
		description: "",
	});

	const [profile, setProfile] = useState({
		name: myVendor?.name || me?.pharmacyName || "",
		address: myVendor?.address || me?.pharmacyAddress || "",
		contact: myVendor?.contact || me?.phone || "",
		lat: myVendor?.lat ?? me?.pharmacyLocation?.lat ?? 9.0765,
		lng: myVendor?.lng ?? me?.pharmacyLocation?.lng ?? 7.3986,
	});

	/** 🔐 Lock the first usable vendor id (auth.uid → myVendor.id → me.id) */
	const lockedVendorIdRef = useRef(null);
	const pickVendorId = () =>
		vendorIdFromParent ?? me?.uid ?? myVendor?.id ?? me?.id ?? null;
	useEffect(() => {
		if (!lockedVendorIdRef.current) {
			const c = pickVendorId();
			if (c) lockedVendorIdRef.current = String(c);
		}
	}, [vendorIdFromParent, me?.uid, myVendor?.id, me?.id]);

	const showingInit = !lockedVendorIdRef.current;

	/** Ensure pharmacist vendor profile uses the SAME id as auth.uid */
	useEffect(() => {
		if (me?.role === "pharmacist" && me?.uid && (!myVendor || !myVendor.id)) {
			const v = {
				id: String(me.uid), // 👈 profile id aligns to auth.uid
				name: profile.name || me?.pharmacyName || "My Pharmacy",
				bio: myVendor?.bio || "",
				address: profile.address || "",
				contact: profile.contact || "",
				etaMins: 30,
				lat: profile.lat,
				lng: profile.lng,
			};
			upsertVendor(v);
			if (!lockedVendorIdRef.current) lockedVendorIdRef.current = v.id;
		}
	}, [me?.role, me?.uid]); // eslint-disable-line

	useEffect(() => {
		if (myVendor) {
			setProfile((p) => ({
				...p,
				name: myVendor.name || p.name,
				address: myVendor.address || p.address,
				contact: myVendor.contact || p.contact,
				lat: myVendor.lat ?? p.lat,
				lng: myVendor.lng ?? p.lng,
			}));
		}
	}, [myVendor]);

	const onPickImage = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const fr = new FileReader();
		fr.onload = () => setForm((v) => ({ ...v, image: fr.result }));
		fr.readAsDataURL(f);
	};

	const ensureVendorId = () => {
		let vid = lockedVendorIdRef.current || pickVendorId();
		if (vid && !lockedVendorIdRef.current)
			lockedVendorIdRef.current = String(vid);
		return vid ? String(vid) : null;
	};

	// Always use product.id and product.pharmId for product references
	const handleAddProduct = (product) =>
		addProduct({
			id: product.id,
			pharmId: vendorId,
			...product,
		});

	const onSubmit = () => {
		if (!form.name.trim()) return alert("Enter product name");
		const vendorId = ensureVendorId();
		if (!vendorId) return alert("Setting up your vendor ID. Try again.");
		handleAddProduct({
			...form,
			price: Number(form.price) || 0,
			stock: Number(form.stock) || 0,
			vendorId: String(vendorId), // 👈 string & equals auth.uid
			vendorName: myVendor?.name || me?.pharmacyName || profile.name || "",
		});
		setForm({
			name: "",
			price: "",
			stock: "",
			image: "",
			category: "Therapeutic",
			description: "",
		});
	};

	const onImport = async (e) => {
		const files = Array.from(e.target.files || []);
		e.target.value = "";
		const vendorId = ensureVendorId();
		if (!vendorId) return alert("Setting up your vendor ID. Try again.");

		const items = [];
		for (const f of files) {
			const text = await f.text();
			if (f.name.endsWith(".csv")) {
				const rows = text.split(/\r?\n/).filter(Boolean);
				const header = rows.shift()?.split(",") || [];
				for (const line of rows) {
					const cols = line.split(",");
					const obj = {};
					header.forEach((h, i) => (obj[h.trim()] = (cols[i] || "").trim()));
					items.push(obj);
				}
			} else if (f.name.endsWith(".xml")) {
				const doc = new DOMParser().parseFromString(text, "application/xml");
				const ps = Array.from(doc.querySelectorAll("product"));
				for (const p of ps) {
					items.push({
						name: p.querySelector("name")?.textContent || "",
						price: p.querySelector("price")?.textContent || "",
						stock: p.querySelector("stock")?.textContent || "",
						image: p.querySelector("image")?.textContent || "",
						category: p.querySelector("category")?.textContent || "",
						vendorName: p.querySelector("vendorName")?.textContent || "",
						description: p.querySelector("description")?.textContent || "",
					});
				}
			}
		}

		const vendorName = myVendor?.name || me?.pharmacyName || profile.name || "";
		const normalized = items.map((it) => ({
			...it,
			price: Number(it.price) || 0,
			stock: Number(it.stock) || 0,
			category: it.category || "Therapeutic",
			vendorId: String(vendorId),
			vendorName,
		}));
		// Instead of local optimistic update, add each product to Firestore and rely on real-time listener
		let added = 0;
		for (const prod of normalized) {
			try {
				await handleAddProduct(prod);
				added++;
			} catch (e) {
				// Optionally handle error
			}
		}
		if (added > 0) {
			if (typeof window !== "undefined" && window.toast)
				window.toast(`Imported ${added} item(s)`);
		}
	};

	return (
		<div className="space-y-6 px-2 sm:px-0">
			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<h3 className="text-2xl font-bold tracking-tighter font-poppins">
						Create Product
					</h3>
					{showingInit && (
						<Badge variant="secondary" className="text-xs">
							Initializing vendor…
						</Badge>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div className="grid gap-2">
						<Label>Name</Label>
						<Input
							value={form.name}
							onChange={(e) =>
								setForm((v) => ({ ...v, name: e.target.value }))
							}
							placeholder="Ibuprofen 400mg"
						/>
					</div>
					<div className="grid gap-2">
						<Label>Price (₦)</Label>
						<Input
							type="number"
							value={form.price}
							onChange={(e) =>
								setForm((v) => ({ ...v, price: e.target.value }))
							}
							placeholder="2500"
						/>
					</div>
					<div className="grid gap-2">
						<Label>Stock</Label>
						<Input
							type="number"
							value={form.stock}
							onChange={(e) =>
								setForm((v) => ({ ...v, stock: e.target.value }))
							}
							placeholder="50"
						/>
					</div>
					<div className="grid gap-2">
						<Label>Category</Label>
						<select
							className="border rounded-md px-3 py-2 text-sm w-full"
							value={form.category}
							onChange={(e) =>
								setForm((v) => ({ ...v, category: e.target.value }))
							}
						>
							{CATEGORIES.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2 md:col-span-2">
						<Label>Description</Label>
						<Textarea
							value={form.description}
							onChange={(e) =>
								setForm((v) => ({ ...v, description: e.target.value }))
							}
							placeholder="Brief product description"
						/>
					</div>
					<div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-3">
						<label className="w-full sm:w-auto">
							<span className="block mb-1 text-blue-600 underline cursor-pointer text-sm">
								Choose photo
							</span>
							<input
								type="file"
								accept="image/*"
								onChange={onPickImage}
								className="hidden"
							/>
						</label>
						{form.image && (
							<img
								src={form.image}
								alt="preview"
								className="h-16 w-16 object-cover rounded-md"
							/>
						)}
						<Button
							onClick={onSubmit}
							className="w-full sm:w-auto ml-auto"
						>
							Add product
						</Button>
					</div>
				</div>
			</section>

			<section className="space-y-3">
				<h3 className="font-semibold">Bulk import</h3>
				<div className="flex flex-col sm:flex-row items-center gap-3">
					{/* Hidden file input, triggered by button */}
					<input
						id="bulk-import-input"
						type="file"
						accept=".csv,.xml"
						multiple
						onChange={onImport}
						className="hidden"
					/>
					<Button
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() =>
							document.getElementById("bulk-import-input").click()
						}
					>
						<Upload className="h-4 w-4 mr-2" />
						Choose files
					</Button>
					{/* Show selected file names (optional, for feedback) */}
					{/* You can add state to track selected files if desired */}
				</div>
			</section>

			<section className="space-y-2">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
					<h3 className="font-semibold">Inventory</h3>
					<div className="text-xs text-slate-500">
						{products.length} item(s)
					</div>
				</div>
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
							<div className="p-3 space-y-1">
								<div className="text-sm font-medium line-clamp-1">
									{p.name}
								</div>
								<div className="text-xs text-slate-500">
									₦{Number(p.price || 0).toLocaleString()} • Stock{" "}
									{p.stock}
								</div>
								<div className="pt-1 flex flex-col sm:flex-row gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											navigator?.clipboard?.writeText(p.id)
										}
									>
										Copy ID
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeProduct(p.id)}
									>
										<Trash2 className="h-4 w-4 mr-1" />
										Remove
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
