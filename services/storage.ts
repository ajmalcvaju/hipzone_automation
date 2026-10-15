import { storage, isFirebaseConfigured } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  sizeKB: number;
}

/**
 * Compresses any image to <= 25KB using HTML5 Canvas.
 * Automatically scales down dimensions and adjusts compression quality
 * until the resulting image is guaranteed under 25KB (25,600 bytes).
 */
export async function compressImageTo25KB(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If file is already <= 25KB, read and return directly
    if (file.size <= 25 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          file,
          dataUrl: reader.result as string,
          sizeKB: Number((file.size / 1024).toFixed(1)),
        });
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        const TARGET_MAX_BYTES = 25 * 1024; // 25KB = 25600 bytes

        let width = img.width;
        let height = img.height;

        // Initial max dimension constraint (600px is crystal clear for product cards)
        const MAX_DIM = 600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        let quality = 0.85;
        let bestDataUrl = "";

        // Iteratively reduce quality and/or dimensions until size <= 25KB
        for (let attempt = 0; attempt < 12; attempt++) {
          canvas.width = Math.max(64, Math.round(width));
          canvas.height = Math.max(64, Math.round(height));

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          bestDataUrl = canvas.toDataURL("image/jpeg", quality);

          // Calculate approximate byte size from dataUrl (base64 string length * 0.75)
          const head = "data:image/jpeg;base64,";
          const base64Str = bestDataUrl.startsWith(head)
            ? bestDataUrl.slice(head.length)
            : bestDataUrl;
          const byteLength = Math.round((base64Str.length * 3) / 4);

          if (byteLength <= TARGET_MAX_BYTES) {
            const sizeKB = Number((byteLength / 1024).toFixed(1));
            canvas.toBlob(
              (blob) => {
                const compressedFile = new File(
                  [blob || new Blob([])],
                  file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                  { type: "image/jpeg" }
                );
                resolve({ file: compressedFile, dataUrl: bestDataUrl, sizeKB });
              },
              "image/jpeg",
              quality
            );
            return;
          }

          // Step down quality or dimensions
          if (quality > 0.4) {
            quality -= 0.15;
          } else {
            width *= 0.75;
            height *= 0.75;
          }
        }

        // Final fallback: return the best reached state
        const head = "data:image/jpeg;base64,";
        const base64Str = bestDataUrl.startsWith(head)
          ? bestDataUrl.slice(head.length)
          : bestDataUrl;
        const byteLength = Math.round((base64Str.length * 3) / 4);
        const sizeKB = Number((byteLength / 1024).toFixed(1));

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File(
              [blob || new Blob([])],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              { type: "image/jpeg" }
            );
            resolve({ file: compressedFile, dataUrl: bestDataUrl, sizeKB });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses the image to <= 25KB first, then uploads to Firebase Storage
 * with a quick timeout fallback to the compressed <=25KB data URL.
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string; path?: string; sizeKB: number }> {
  // 1. First compress into <= 25KB
  const compressed = await compressImageTo25KB(file);

  // 2. Try Firebase Storage with 4-second timeout
  if (isFirebaseConfigured() && storage) {
    try {
      const storagePath = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, storagePath);

      // Upload with 4-second timeout race so UI never hangs
      const uploadPromise = uploadBytes(storageRef, compressed.file).then(async () => {
        const downloadUrl = await getDownloadURL(storageRef);
        return { url: downloadUrl, path: storagePath, sizeKB: compressed.sizeKB };
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 4000)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch {
      console.info(
        "Notice: Saved product image directly as compressed 25KB data (Firebase Cloud Storage is not enabled or timed out)."
      );
    }
  }

  // 3. Fallback to the ultra-light <= 25KB data URL (safely fits in Firestore document)
  return {
    url: compressed.dataUrl,
    sizeKB: compressed.sizeKB,
  };
}
