const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format paise as ₹ with Indian digit grouping, e.g. 2850000 → ₹28,500 */
export function formatINR(paise: number) {
  return inr.format(Math.round(paise / 100));
}

/** Convert a rupee amount typed by a person (e.g. "28,500") to paise. */
export function rupeesToPaise(value: string | number) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  return Math.round(n * 100);
}

export function orderNumber(n: number) {
  return `SM${String(n).padStart(5, "0")}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDate(d: Date) {
  return dateFmt.format(d);
}
