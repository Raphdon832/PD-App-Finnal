import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Pill, Plus } from "lucide-react";

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
const toRad = (d) => (d * Math.PI) / 180;
const haversineKm = (a, b) => {
	if (!a || !b) return null;
	const R = 6371;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const s =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
};
const etaMinutes = (km) => {
	if (km == null) return null;
	const avgKmh = 22;
	const prep = 8;
	const mins = prep + (km / avgKmh) * 60;
	return Math.max(5, Math.min(90, Math.round(mins)));
};

export default function Home({ go, vendors, products, addToCart, userLoc }) {
	const [query, setQuery] = React.useState("");
	const [showSuggestions, setShowSuggestions] = React.useState(false);

	const pharmacySuggestions = React.useMemo(() => {
		if (!query.trim()) return [];
		return vendors.filter((v) =>
			v.name.toLowerCase().includes(query.toLowerCase())
		);
	}, [vendors, query]);

	const productSuggestions = React.useMemo(() => {
		if (!query.trim()) return [];
		return products.filter((p) =>
			p.name.toLowerCase().includes(query.toLowerCase())
		);
	}, [products, query]);

	const handleSuggestionClick = (type, id) => {
		setShowSuggestions(false);
		if (type === "pharmacy") {
			go("vendorProfile", { id });
		} else if (type === "product") {
			go("product", { id });
		}
	};

	const newArrivals = React.useMemo(() => products.slice(0, 8), [products]);
	const filtered = React.useMemo(
		() =>
			newArrivals.filter((p) =>
				p.name.toLowerCase().includes(query.toLowerCase())
			),
		[newArrivals, query]
	);

	const vendorById = React.useCallback(
		(id) => vendors.find((v) => v.id === id),
		[vendors]
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						className="pl-9 font-poppins tracking-tighter"
						placeholder="Search medicines or pharmacies"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
					/>
					{showSuggestions &&
						(pharmacySuggestions.length > 0 ||
							productSuggestions.length > 0) && (
							<div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-72 overflow-auto">
								{pharmacySuggestions.length > 0 && (
									<div className="px-3 py-2 text-xs text-slate-500 font-semibold">
										Pharmacies
									</div>
								)}
								{pharmacySuggestions.map((v) => (
									<div
										key={v.id}
										className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm font-poppins tracking-tighter"
										onMouseDown={() => handleSuggestionClick("pharmacy", v.id)}
									>
										{v.name}
									</div>
								))}
								{productSuggestions.length > 0 && (
									<div className="px-3 py-2 text-xs text-slate-500 font-semibold">
										Products
									</div>
								)}
								{productSuggestions.map((p) => (
									<div
										key={p.id}
										className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm font-poppins tracking-tighter"
										onMouseDown={() => handleSuggestionClick("product", p.id)}
									>
										{p.name}{" "}
										<span className="text-xs text-slate-400">
											(
											{vendors.find((v) => v.id === p.vendorId)?.name || "—"})
										</span>
									</div>
								))}
							</div>
						)}
				</div>
				<Button
					variant="outline"
					onClick={() => go("catalog")}
					className="font-poppins tracking-tighter"
				>
					<SlidersHorizontal className="h-4 w-4 mr-2" />
					Filters
				</Button>
			</div>

			{/* Change #2: add no-scrollbar */}
			<div className="flex gap-2 overflow-x-auto no-scrollbar py-1 font-poppins tracking-tighter">
				{CATEGORIES.map((cat) => (
					<Badge
						key={cat}
						variant="secondary"
						className="shrink-0 cursor-pointer"
						onClick={() => go("catalog", { category: cat })}
					>
						{cat}
					</Badge>
				))}
			</div>

			<section>
				<div className="flex items-center justify-between mb-2 font-poppins color-blue-600">
					<h3 className="font-semibold font-poppins tracking-tighter">
						New Arrivals
					</h3>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => go("catalog")}
						className="text-blue-400 hover:text-blue-700 hover:bg-blue-50"
					>
						View all
					</Button>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{filtered.map((p) => {
						const v = vendorById(p.vendorId);
						const distanceKm =
							userLoc && v?.lat != null && v?.lng != null
								? haversineKm(userLoc, { lat: v.lat, lng: v.lng })
								: null;
						const eta = etaMinutes(distanceKm);
						const etaLabel =
							eta != null && v?.name
								? `${eta} mins to ${v.name}`
								: null;

						return (
							<div
								key={p.id}
								className="border-[1px] border-gray-200 rounded-[10px] overflow-hidden bg-gray-50"
							>
								<div
									className="aspect-square bg-slate-100 flex items-center justify-center cursor-pointer"
									onClick={() => go("product", { id: p.id })}
								>
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
								<div className="p-3">
									<div className="text-xs text-slate-500 mb-1 font-poppins tracking-tighter">
										{v?.name || "—"}
									</div>
									<div className="text-sm font-medium line-clamp-1 font-poppins tracking-tighter">
										{p.name}
									</div>
									<div className="text-sm font-semibold font-poppins">
										{currency(p.price)}
									</div>
									{etaLabel && (
										<div className="mt-0.5 text-[11px] text-slate-500">
											{etaLabel}
										</div>
									)}
									<div className="mt-2 flex items-center gap-2">
										<Button
											size="sm"
											className="flex-1 rounded-[1px] font-poppins tracking-tighter"
											onClick={() => go("product", { id: p.id })}
										>
											View
										</Button>
										<Button
											size="icon"
											variant="outline"
											onClick={() => addToCart(p.id)}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Ensure vendor name is shown for each product */}
			{products.map((p) => {
				const v = vendorById(p.vendorId);
				return (
					<div key={p.id} className="border-b py-2">
						<div className="text-sm text-slate-500">
							{v?.name || "—"}
						</div>
						<div className="text-base font-medium">
							{p.name}
						</div>
					</div>
				);
			})}
		</div>
	);
}
