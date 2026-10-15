import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { Quotation, QuotationStatus } from "@/types";
import { generateId } from "@/lib/utils";
import { getCompanySettings } from "./settings";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

const QUOTATIONS_KEY = "hipzone_quotations_cache";

function computeStatus(q: Quotation): QuotationStatus {
  if (q.status === "accepted" || q.status === "rejected") {
    return q.status;
  }
  if (q.validUntil) {
    const validDate = new Date(q.validUntil);
    const now = new Date();
    if (now > validDate) {
      return "expired";
    }
  }
  return q.status;
}

function getLocalQuotations(): Quotation[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(QUOTATIONS_KEY);
  if (!stored) {
    // Return sample initial quotation based on reference
    const sampleQuotation: Quotation = {
      id: "quote_sample_1",
      quotationNumber: "HZA-2026-0001",
      quotationDate: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "draft",
      client: {
        name: "Insaf",
        phone: "+91 9828281929",
        address: "Naduvannur, Calicut, Kerala",
        email: "insaf@example.com",
      },
      projectDescription:
        "HIPZONE AUTOMATION transforms homes and businesses into smarter, safer, and more intelligent spaces. With over 8 years of expertise in India and an expanding presence in Dubai, we deliver AI-integrated automation and security solutions powered by trusted global brands.\n\nOur intelligent systems go beyond standard automation. They learn your lifestyle, anticipate your needs, and optimize comfort, security, and energy efficiency automatically. We combine technical expertise with personalized service to ensure every project is reliable, future-ready, and supported by strong customer care.",
      taxRate: 5,
      currency: "INR",
      salesContact: {
        name: "Sales Team",
        contact: "name@hipzoneautomation",
      },
      technicalSupport: {
        phone: "+91 7012566008",
        email: "support@hipzoneautomation.com",
      },
      termsAndConditions:
        "Thank you for your interest in Hipzone Automation India. We are committed to delivering innovative and reliable home automation solutions. Please review the following terms and conditions\n\nPrices: All prices are quoted in INR (Indian Rupees) and are inclusive of applicable taxes, unless otherwise specified\n\nValidity: This proposal remains valid for 30 days from the date of issue.\n\nInstallation: The proposal does not include costs for additional wiring, alterations, or modifications required at the time of installation.\n\nMobile Application: The Hipzone mobile app is free of charge and can be installed on multiple devices.",
      paymentTerms:
        "1. 25% – Upon order confirmation.\n2. 50% – Upon marking automation points and providing wiring drawings at the site.\n3. 75% – Upon completion of range mapping and site testing (including verification of electrical components, switch-boxes, lights, and automation provisions).\n4. 100% – Prior to dispatch of materials.",
      pricingTerms: "All prices are inclusive of applicable taxes.",
      cancellationPolicy:
        "Any advance paid will be refunded if cancellation is made within 3 days of payment. After this period, the advance is non-refundable.",
      pages: [
        {
          id: "page_1",
          pageNumber: 1,
          tables: [
            {
              id: "tab_1",
              title: "CCTV",
              type: "4-col",
              items: [
                {
                  id: "item_1",
                  name: "3 MP HI FOCUS 8 N Cameras with 16 Channel NVR",
                  description:
                    "3 MP HI FOCUS 8 N Camers, with 16 Channel NVR, 4 TB System, cabling charge Extra",
                  qty: 1,
                  price: 72800,
                  total: 72800,
                },
              ],
            },
            {
              id: "tab_2",
              title: "GATE AUTOMATION",
              type: "4-col",
              items: [
                {
                  id: "item_2",
                  name: "FOXTECH.UK / Striv Automation 500 KG Motorisation",
                  description:
                    "FOXTECH.UK / Striv Automation 500 KG Motorisation & Installation",
                  qty: 1,
                  price: 69000,
                  total: 69000,
                },
              ],
            },
            {
              id: "tab_3",
              title: "IP VIDEO DOOR PHONE SYSTEM",
              type: "4-col",
              items: [
                {
                  id: "item_3",
                  name: "Hikvision IP video door phone System",
                  description: "Hikvision IP video door phone System",
                  qty: 1,
                  price: 28500,
                  total: 28500,
                },
              ],
            },
            {
              id: "tab_4",
              title: "LIGHT AUTOMATION",
              type: "4-col",
              items: [
                {
                  id: "item_4",
                  name: "3 Switches in a switchboard Automation",
                  description:
                    "3 Switches Ina switch board (6 A load) Automation & Installation",
                  qty: 1,
                  price: 8500,
                  total: 8500,
                },
              ],
            },
          ],
        },
      ],
      subtotal: 178800,
      taxAmount: 0,
      grandTotal: 178800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify([sampleQuotation]));
    return [sampleQuotation];
  }

  try {
    const parsed: Quotation[] = JSON.parse(stored);
    return parsed.map((q) => ({
      ...q,
      status: computeStatus(q),
    }));
  } catch {
    return [];
  }
}

function setLocalQuotations(quotes: Quotation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(quotes));
}

export async function getQuotations(): Promise<Quotation[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as Quotation;
          return { ...item, status: computeStatus(item) };
        });
      }
    } catch (err) {
      console.warn("Firestore quotations fetch error:", err);
    }
  }

  return getLocalQuotations();
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, "quotations", id));
      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() } as Quotation;
        return { ...item, status: computeStatus(item) };
      }
    } catch (err) {
      console.warn("Firestore getQuotationById error:", err);
    }
  }

  const local = getLocalQuotations();
  const found = local.find((q) => q.id === id);
  return found || null;
}

export async function generateNextQuotationNumber(): Promise<string> {
  const settings = await getCompanySettings();
  const prefix = settings.quotationPrefix || "HZA-2026-";
  const quotes = await getQuotations();

  let maxNum = 0;
  for (const q of quotes) {
    if (q.quotationNumber && q.quotationNumber.startsWith(prefix)) {
      const numPart = parseInt(q.quotationNumber.replace(prefix, ""), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function saveQuotation(quotation: Quotation): Promise<Quotation> {
  const updatedQuotation: Quotation = {
    ...quotation,
    updatedAt: new Date().toISOString(),
  };

  if (!updatedQuotation.id) {
    updatedQuotation.id = generateId("quote");
    updatedQuotation.createdAt = new Date().toISOString();
  }

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "quotations", updatedQuotation.id), updatedQuotation);
    } catch (err) {
      console.warn("Firestore saveQuotation error:", err);
    }
  }

  const local = getLocalQuotations();
  const index = local.findIndex((q) => q.id === updatedQuotation.id);
  if (index !== -1) {
    local[index] = updatedQuotation;
    setLocalQuotations(local);
  } else {
    setLocalQuotations([updatedQuotation, ...local]);
  }

  return updatedQuotation;
}

export async function duplicateQuotation(id: string): Promise<Quotation> {
  const original = await getQuotationById(id);
  if (!original) throw new Error("Quotation not found");

  const newNumber = await generateNextQuotationNumber();
  const duplicated: Quotation = {
    ...original,
    id: generateId("quote"),
    quotationNumber: newNumber,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveQuotation(duplicated);
}

export async function deleteQuotation(id: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "quotations", id));
    } catch (err) {
      console.warn("Firestore deleteQuotation error:", err);
    }
  }

  const local = getLocalQuotations();
  const filtered = local.filter((q) => q.id !== id);
  setLocalQuotations(filtered);
}
