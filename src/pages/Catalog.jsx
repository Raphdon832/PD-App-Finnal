import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Pill, Plus } from "lucide-react";

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

export default function Catalog({
	go,
	vendors,
	products,
	addToCart,
	initialCategory,
	userLoc,
}) {
	const [query, setQuery] = React.useState("");
	const [activeCat, setActiveCat] = React.useState(initialCategory || null);
	React.useEffect(() => {
		setActiveCat(initialCategory || null);
	}, [initialCategory]);

	const list = React.useMemo(
		() =>
			products.filter((p) => {
				const okQ = p.name.toLowerCase().includes(query.toLowerCase());
				const okC = activeCat ? p.category === activeCat : true;
				return okQ && okC;
			}),
		[products, query, activeCat]
	);

	const vendorById = React.useCallback(
		(id) => vendors.find((v) => v.id === id),
		[vendors]
	);

	return (
		<div className="space-y-3 font-poppins tracking-tighter">
			<div className="flex items-center gap-2">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						className="pl-9 font-poppins tracking-tighter"
						placeholder="Search all products"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-1">
				<Badge
					variant={activeCat === null ? "default" : "secondary"}
					className="shrink-0 cursor-pointer font-poppins tracking-tighter"
					onClick={() => setActiveCat(null)}
				>
					All
				</Badge>
				{CATEGORIES.map((cat) => (
					<Badge
						key={cat}
						variant={activeCat === cat ? "default" : "secondary"}
						className="shrink-0 cursor-pointer font-poppins tracking-tighter"
						onClick={() => setActiveCat(cat)}
					>
						{cat}
					</Badge>
				))}
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{list.map((p) => {
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
							className="border rounded-xl overflow-hidden font-poppins tracking-tighter"
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
							<div className="p-3 font-poppins tracking-tighter">
								<div className="text-xs text-slate-500 mb-1 tracking-tighter">
									{v?.name || "—"}
								</div>
								<div className="text-sm font-medium line-clamp-1 tracking-tighter">
									{p.name}
								</div>
								<div className="text-sm font-semibold tracking-tighter">
									{currency(p.price)}
								</div>
								{etaLabel && (
									<div className="mt-0.5 text-[11px] text-slate-500 tracking-tighter">
										{etaLabel}
									</div>
								)}
								<div className="mt-2 flex items-center gap-2 tracking-tighter">
									<Button
										size="sm"
										className="flex-1 font-poppins tracking-tighter"
										onClick={() => go("product", { id: p.id })}
									>
										View
									</Button>
									<Button
										size="icon"
										variant="outline"
										className="font-poppins tracking-tighter"
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
		</div>
	);
}
