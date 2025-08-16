/* FILE: src/lib/utils.js */
export const currency = (n) => `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
export const uid = () => Math.random().toString(36).slice(2, 10);
export function saveToLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
export function loadFromLS(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
export function parseCSV(text) {
  const rows = []; let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) { const c = text[i];
    if (c === '"') { if (inQuotes && text[i+1] === '"') { field += '"'; i++; } else inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !inQuotes) { if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ''; } }
    else { field += c; } i++; }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return []; const [header, ...rest] = rows;
  return rest.filter(r=>r.length>0).map(r => Object.fromEntries(header.map((h, idx) => [h.trim(), (r[idx]||'').trim()])));
}
export function parseXMLProducts(xmlText) {
  try { const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    return Array.from(doc.querySelectorAll('product')).map(p => ({
      name: p.querySelector('name')?.textContent || '',
      price: Number(p.querySelector('price')?.textContent || 0),
      stock: Number(p.querySelector('stock')?.textContent || 0),
      image: p.querySelector('image')?.textContent || '',
      category: p.querySelector('category')?.textContent || 'Therapeutic',
      vendorName: p.querySelector('vendorName')?.textContent || '',
      description: p.querySelector('description')?.textContent || ''
    })); } catch { return []; }
}