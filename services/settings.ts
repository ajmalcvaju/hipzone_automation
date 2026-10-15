import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { CompanySettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SETTINGS_KEY = "hipzone_company_settings";

export async function getCompanySettings(): Promise<CompanySettings> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, "settings", "company"));
      if (snap.exists()) {
        return snap.data() as CompanySettings;
      }
    } catch (err) {
      console.warn("Firestore fetch settings error:", err);
    }
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        // use default
      }
    }
  }

  return DEFAULT_SETTINGS;
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "settings", "company"), settings);
    } catch (err) {
      console.warn("Firestore save settings error:", err);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
