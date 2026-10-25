import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `₹ 0.00`;
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === "INR" || currency === "₹") {
    return `₹ ${formatted}`;
  }
  return `${currency} ${formatted}`;
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + a[n % 10] : "") + " ";
    } else if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  }

  const rounded = Math.round(num);
  let n = rounded;
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let remainder = n;

  let res = "";
  if (crore > 0) res += inWords(crore) + " Crore ";
  if (lakh > 0) res += inWords(lakh) + " Lakh ";
  if (thousand > 0) res += inWords(thousand) + " Thousand ";
  if (remainder > 0) res += inWords(remainder);

  res = res.trim();
  return `Rupees ${res} Only (Rounded)`;
}

export interface QuotationTotals {
  has7Col: boolean;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  subtotal: number;
}

export function computeQuotationTotals(
  pages: any[] = [],
  taxRate: number = 18
): QuotationTotals {
  let taxable = 0;
  let tax = 0;
  let grand = 0;
  let has7Col = false;

  pages.forEach((page) => {
    page.tables?.forEach((table: any) => {
      if (table.type === "7-col") {
        has7Col = true;
        table.items?.forEach((it: any) => {
          const qty = it.qty || 1;
          const itTaxPct = it.taxPercent ?? taxRate ?? 18;

          // For 7-col table, the Billing Price (it.total) is already tax-added.
          // Taxable amount is the base amount WITHOUT tax:
          let itemBase = 0;
          if (typeof it.price === "number" && it.price > 0) {
            itemBase = qty * it.price;
          } else if (typeof it.total === "number" && it.total > 0) {
            itemBase = it.total / (1 + itTaxPct / 100);
          }

          let itemTax = 0;
          if (typeof it.taxAmount === "number" && it.taxAmount > 0) {
            itemTax = it.taxAmount;
          } else {
            itemTax = (itemBase * itTaxPct) / 100;
          }

          const itemTotal =
            typeof it.total === "number" && it.total > 0 ? it.total : itemBase + itemTax;

          taxable += itemBase;
          tax += itemTax;
          grand += itemTotal;
        });
      } else {
        // 2-col or 4-col table: Subtotal is taken directly as taxable amount
        table.items?.forEach((it: any) => {
          const itemBase = it.total || (it.qty ? it.qty * it.price : it.price) || 0;
          const itemTax = (itemBase * taxRate) / 100;

          taxable += itemBase;
          tax += itemTax;
          grand += itemBase + itemTax;
        });
      }
    });
  });

  return {
    has7Col,
    taxableAmount: taxable,
    taxAmount: tax,
    grandTotal: grand,
    subtotal: taxable,
  };
}
