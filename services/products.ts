import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { Product } from "@/types";
import { INITIAL_PRODUCTS_SEED } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";

const STORAGE_KEY = "hipzone_products_cache";

function cleanForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export const DUMMY_PRODUCT_NAMES = new Set([
  "eGlu Hub Plus",
  "Door Sensor",
  "Lock Module",
  "DALI Tunable Driver 50W",
  "SCB SQR- Metallic Gray",
  "In-Wall Switch 2S",
  "Dry Contact Switch Controller",
  "In-Wall Switch Triple Module (IWS-3S)",
  "LPG Sensor",
  "In-Wall 16A Switch Module (IWS-16A)",
  "Dali Controller - Stand alone",
  "Multi Sensor Controller",
  "Gate Controller DC",
]);

export function isDummyProduct(p: { id?: string; name: string }): boolean {
  if (p.id && (p.id.startsWith("seed_prod_") || p.id.startsWith("seed_"))) return true;
  if (DUMMY_PRODUCT_NAMES.has(p.name)) return true;
  return false;
}

function getLocalProducts(): Product[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const list: Product[] = JSON.parse(stored);
    const cleaned = list.filter((p) => !isDummyProduct(p));
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function setLocalProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  const cleaned = products.filter((p) => !isDummyProduct(p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

export async function clearDummyProducts(): Promise<void> {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const list: Product[] = JSON.parse(stored);
        const cleaned = list.filter((p) => !isDummyProduct(p));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  const firestore = db;
  if (isFirebaseConfigured() && firestore) {
    try {
      const q = query(collection(firestore, "products"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      let count = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (isDummyProduct({ id: docSnap.id, name: data.name })) {
          batch.delete(doc(firestore, "products", docSnap.id));
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn("Error purging dummy products in Firestore:", err);
    }
  }
}

export async function getProducts(): Promise<Product[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Product[];

        // Purge dummy products if any exist in Firestore
        const dummyDocs = docs.filter(isDummyProduct);
        if (dummyDocs.length > 0) {
          clearDummyProducts().catch(() => {});
        }

        const validProducts = docs.filter((p) => !isDummyProduct(p));
        // Always sync Firestore products into local cache
        setLocalProducts(validProducts);
        return validProducts;
      }
    } catch (err) {
      console.warn("Firestore fetch error, falling back to local cache:", err);
    }
  }

  return getLocalProducts();
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const newProduct: Product = {
    ...data,
    id: generateId("prod"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const firestore = db;
  if (isFirebaseConfigured() && firestore) {
    try {
      const cleanData = cleanForFirestore(newProduct);
      await setDoc(doc(firestore, "products", newProduct.id), cleanData);
      console.log("Successfully stored product in Firebase Firestore:", newProduct.id);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Firestore createProduct error:", error);
      toast.error(`Firebase Cloud sync notice: ${error.message || "Failed to sync to Firestore"}`);
    }
  }

  const local = getLocalProducts();
  const updated = [newProduct, ...local];
  setLocalProducts(updated);

  return newProduct;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product> {
  const updatedAt = new Date().toISOString();
  const firestore = db;

  if (isFirebaseConfigured() && firestore) {
    try {
      const cleanData = cleanForFirestore({
        ...data,
        updatedAt,
      });
      // setDoc with { merge: true } safely creates or updates without throwing NOT_FOUND
      await setDoc(doc(firestore, "products", id), cleanData, { merge: true });
      console.log("Successfully updated product in Firebase Firestore:", id);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Firestore updateProduct error:", error);
      toast.error(`Firebase Cloud update notice: ${error.message || "Failed to update in Firestore"}`);
    }
  }

  const local = getLocalProducts();
  const index = local.findIndex((p) => p.id === id);
  if (index !== -1) {
    local[index] = { ...local[index], ...data, updatedAt };
    setLocalProducts(local);
    return local[index];
  }

  // If the product was fetched from Firestore and was not yet in local cache,
  // gracefully upsert it into local cache instead of throwing an error!
  const upsertedProduct: Product = {
    id,
    name: data.name || "Product",
    price: data.price ?? 0,
    isActive: true,
    createdAt: updatedAt,
    updatedAt,
    ...data,
  };
  setLocalProducts([upsertedProduct, ...local]);
  return upsertedProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const firestore = db;
  if (isFirebaseConfigured() && firestore) {
    try {
      await deleteDoc(doc(firestore, "products", id));
      console.log("Successfully deleted product from Firebase Firestore:", id);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Firestore deleteProduct error:", error);
    }
  }

  const local = getLocalProducts();
  const filtered = local.filter((p) => p.id !== id);
  setLocalProducts(filtered);
}

export async function importProductsBulk(
  products: Array<{
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    itemCode?: string;
    hsn?: string;
    purchasePrice?: number;
    discountType?: string;
    saleDiscount?: number;
    stockQty?: number;
    minStock?: number;
  }>
): Promise<{ added: number; failed: number }> {
  let addedCount = 0;
  let failedCount = 0;

  const validProducts: Product[] = [];

  for (const item of products) {
    if (!item.name || typeof item.price !== "number" || item.price < 0 || isNaN(item.price)) {
      failedCount++;
      continue;
    }
    const newProd: Product = {
      id: generateId("bulk_prod"),
      name: item.name.trim(),
      price: item.price,
      description: item.description?.trim() || "",
      imageUrl: item.imageUrl?.trim() || undefined,
      category: item.category?.trim() || undefined,
      itemCode: item.itemCode?.trim() || undefined,
      hsn: item.hsn?.trim() || undefined,
      purchasePrice: typeof item.purchasePrice === "number" ? item.purchasePrice : undefined,
      discountType: item.discountType?.trim() || undefined,
      saleDiscount: typeof item.saleDiscount === "number" ? item.saleDiscount : undefined,
      stockQty: typeof item.stockQty === "number" ? item.stockQty : undefined,
      minStock: typeof item.minStock === "number" ? item.minStock : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    validProducts.push(newProd);
    addedCount++;
  }

  const firestore = db;
  if (isFirebaseConfigured() && firestore && validProducts.length > 0) {
    try {
      // Chunk in batches of 400
      const chunkSize = 400;
      for (let i = 0; i < validProducts.length; i += chunkSize) {
        const chunk = validProducts.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);
        for (const prod of chunk) {
          const docRef = doc(firestore, "products", prod.id);
          batch.set(docRef, cleanForFirestore(prod));
        }
        await batch.commit();
      }
      console.log(`Successfully synced ${validProducts.length} bulk products to Firebase Firestore`);
    } catch (err) {
      console.error("Firestore bulk batch write error:", err);
      toast.error("Could not write all products to Cloud Firebase. Saved to local storage.");
    }
  }

  const current = getLocalProducts();
  setLocalProducts([...validProducts, ...current]);

  return { added: addedCount, failed: failedCount };
}
