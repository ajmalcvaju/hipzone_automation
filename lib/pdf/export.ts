import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * Patches CanvasGradient and CanvasRenderingContext2D to safely handle
 * modern CSS gradient syntax (e.g. Tailwind v4's "in oklab") and non-finite numbers (NaN/Infinity).
 */
function patchCanvasAPI(targetWin: any): () => void {
  if (!targetWin) return () => {};

  const cleanups: (() => void)[] = [];

  try {
    // 1. Patch CanvasGradient.prototype.addColorStop
    if (targetWin.CanvasGradient && targetWin.CanvasGradient.prototype) {
      const origAddColorStop = targetWin.CanvasGradient.prototype.addColorStop;
      targetWin.CanvasGradient.prototype.addColorStop = function (
        offset: number,
        color: string
      ) {
        let safeOffset = offset;
        if (typeof safeOffset !== "number" || !Number.isFinite(safeOffset) || Number.isNaN(safeOffset)) {
          safeOffset = 0;
        }
        safeOffset = Math.max(0, Math.min(1, safeOffset));
        try {
          origAddColorStop.call(this, safeOffset, color || "#0077b6");
        } catch {
          // Swallow any malformed color strings without crashing PDF generation
        }
      };
      cleanups.push(() => {
        targetWin.CanvasGradient.prototype.addColorStop = origAddColorStop;
      });
    }

    // 2. Patch CanvasRenderingContext2D gradient methods
    if (targetWin.CanvasRenderingContext2D && targetWin.CanvasRenderingContext2D.prototype) {
      const origCreateLinear = targetWin.CanvasRenderingContext2D.prototype.createLinearGradient;
      targetWin.CanvasRenderingContext2D.prototype.createLinearGradient = function (
        x0: number,
        y0: number,
        x1: number,
        y1: number
      ) {
        const sx0 = Number.isFinite(x0) ? x0 : 0;
        const sy0 = Number.isFinite(y0) ? y0 : 0;
        const sx1 = Number.isFinite(x1) ? x1 : sx0 + 1;
        const sy1 = Number.isFinite(y1) ? y1 : sy0;
        return origCreateLinear.call(this, sx0, sy0, sx1, sy1);
      };
      cleanups.push(() => {
        targetWin.CanvasRenderingContext2D.prototype.createLinearGradient = origCreateLinear;
      });

      const origCreateRadial = targetWin.CanvasRenderingContext2D.prototype.createRadialGradient;
      targetWin.CanvasRenderingContext2D.prototype.createRadialGradient = function (
        x0: number,
        y0: number,
        r0: number,
        x1: number,
        y1: number,
        r1: number
      ) {
        const sx0 = Number.isFinite(x0) ? x0 : 0;
        const sy0 = Number.isFinite(y0) ? y0 : 0;
        const sr0 = Number.isFinite(r0) && r0 >= 0 ? r0 : 0;
        const sx1 = Number.isFinite(x1) ? x1 : sx0 + 1;
        const sy1 = Number.isFinite(y1) ? y1 : sy0;
        const sr1 = Number.isFinite(r1) && r1 >= 0 ? r1 : 1;
        return origCreateRadial.call(this, sx0, sy0, sr0, sx1, sy1, sr1);
      };
      cleanups.push(() => {
        targetWin.CanvasRenderingContext2D.prototype.createRadialGradient = origCreateRadial;
      });
    }
  } catch (err) {
    console.warn("Unable to patch canvas methods:", err);
  }

  return () => {
    cleanups.forEach((restore) => {
      try {
        restore();
      } catch {
        // ignore
      }
    });
  };
}

export async function downloadQuotationPDF(
  quotationNumber: string,
  clientName?: string
): Promise<void> {
  const toastId = toast.loading("Generating crystal-clear PDF quotation...");

  // Canvas helper to convert modern CSS color functions (lab, oklch, oklab) to standard RGB
  const helperCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const helperCtx = helperCanvas ? helperCanvas.getContext("2d") : null;

  const sanitizeColorString = (val: string): string => {
    if (!val) return val;
    let res = val;
    if (res.includes("in oklab")) res = res.replaceAll("in oklab", "");
    if (res.includes("in oklch")) res = res.replaceAll("in oklch", "");
    if (
      res.includes("lab(") ||
      res.includes("oklch(") ||
      res.includes("oklab(") ||
      res.includes("lch(")
    ) {
      res = res.replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/g, (match) => {
        if (!helperCtx) return "#cbd5e1";
        try {
          helperCtx.fillStyle = "#123456";
          helperCtx.fillStyle = match;
          if (
            helperCtx.fillStyle === "#123456" ||
            helperCtx.fillStyle === "#000000" ||
            helperCtx.fillStyle === "rgb(0, 0, 0)"
          ) {
            return "#cbd5e1";
          }
          return helperCtx.fillStyle;
        } catch {
          return "#cbd5e1";
        }
      });
    }
    return res;
  };

  // Intercept window.getComputedStyle during rendering to prevent modern color crashes
  const originalGetComputedStyle = typeof window !== "undefined" ? window.getComputedStyle : null;
  if (typeof window !== "undefined" && originalGetComputedStyle) {
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          const val = (target as any)[prop];
          if (typeof val === "string") {
            return sanitizeColorString(val);
          }
          if (typeof val === "function") {
            return val.bind(target);
          }
          return val;
        },
      });
    };
  }

  // Globally patch main window Canvas prototypes before html2canvas executes
  const restoreMainWindowCanvas = typeof window !== "undefined" ? patchCanvasAPI(window) : () => {};
  let restoreClonedWindowCanvas: () => void = () => {};

  try {
    const pages = document.querySelectorAll<HTMLElement>(".quotation-page");
    if (!pages || pages.length === 0) {
      toast.error("Quotation document not found on page.", { id: toastId });
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], "portrait");
      }

      const canvas = await html2canvas(page, {
        scale: 2.5, // 2.5x Ultra HD resolution (~300 DPI)
        useCORS: true,
        logging: false,
        backgroundColor: "#000000",
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Reset container transform (zoom) so capture is 100% natural 210mm width
          const container = clonedDoc.querySelector("#quotation-document-container") as HTMLElement;
          if (container) {
            container.style.transform = "none";
            container.style.width = "210mm";
            container.style.margin = "0";
            container.style.padding = "0";
          }

          // Strip all buttons, edit toolbars, delete icons, and non-printable elements
          clonedDoc
            .querySelectorAll(
              'button, input[type="button"], input[type="submit"], .print\\:hidden, .no-export, [data-no-export="true"]'
            )
            .forEach((el) => {
              el.remove();
            });

          // Replace input elements and textareas with standard text spans so no form outlines/borders appear
          clonedDoc.querySelectorAll("input:not([type='hidden']), textarea").forEach((inp) => {
            const inputEl = inp as HTMLInputElement | HTMLTextAreaElement;
            const span = clonedDoc.createElement("span");
            span.textContent = inputEl.value || "";
            span.className = inputEl.className;
            span.style.cssText = inputEl.style.cssText;
            span.style.border = "none";
            span.style.outline = "none";
            span.style.background = "transparent";
            span.style.boxShadow = "none";
            span.style.padding = "0";
            span.style.margin = "0";
            span.style.display = "inline-block";
            span.style.color = (inputEl as HTMLElement).style.color || "#ffffff";
            inputEl.parentNode?.replaceChild(span, inputEl);
          });

          // Inject universal typography & clean layout styles to eliminate letter-squishing
          const overrideStyle = clonedDoc.createElement("style");
          overrideStyle.textContent = `
            * {
              letter-spacing: 0px !important;
              word-spacing: normal !important;
              font-feature-settings: normal !important;
              font-family: Arial, Helvetica, sans-serif !important;
              -webkit-font-smoothing: antialiased !important;
            }
            .text-slate-100 { color: #f1f5f9 !important; }
            .text-slate-200 { color: #e2e8f0 !important; }
            .text-slate-300 { color: #cbd5e1 !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .text-white { color: #ffffff !important; }
            .text-emerald-400, .text-emerald-500, .text-emerald-600 { color: #34d399 !important; }
            .quotation-page {
              width: 210mm !important;
              min-height: 297mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
              box-sizing: border-box !important;
            }
            #quotation-document-container {
              transform: none !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:hidden, .no-export, [data-no-export="true"], button {
              display: none !important;
            }
          `;
          clonedDoc.head.appendChild(overrideStyle);

          // Wrap cloned iframe window getComputedStyle and patch its Canvas API
          const clonedWin = clonedDoc.defaultView || window;
          if (clonedWin) {
            restoreClonedWindowCanvas = patchCanvasAPI(clonedWin);

            if (clonedWin !== window) {
              const origCloned = clonedWin.getComputedStyle;
              clonedWin.getComputedStyle = function (elt: Element, pseudo?: string | null) {
                const style = origCloned.call(clonedWin, elt, pseudo);
                return new Proxy(style, {
                  get(target, prop) {
                    const val = (target as any)[prop];
                    if (typeof val === "string") {
                      return sanitizeColorString(val);
                    }
                    if (typeof val === "function") {
                      return val.bind(target);
                    }
                    return val;
                  },
                });
              };
            }
          }

          // Sanitize any style blocks in cloned document (stripping 'in oklab' and modern color spaces)
          clonedDoc.querySelectorAll("style").forEach((s) => {
            if (s.textContent) {
              s.textContent = sanitizeColorString(s.textContent);
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "NONE");

      // Extract clickable links on this page and embed them into the PDF
      const linkElements = page.querySelectorAll<HTMLElement>("a[href], [data-pdf-link]");
      const pageRect = page.getBoundingClientRect();
      if (pageRect.width > 0 && pageRect.height > 0) {
        linkElements.forEach((el) => {
          const href = el.getAttribute("data-pdf-link") || el.getAttribute("href");
          if (!href || href === "#" || href.startsWith("javascript:")) return;

          const customLeft = el.getAttribute("data-pdf-left");
          const customTop = el.getAttribute("data-pdf-top");
          const customWidth = el.getAttribute("data-pdf-width");
          const customHeight = el.getAttribute("data-pdf-height");

          let x: number, y: number, w: number, h: number;
          if (customLeft && customTop && customWidth && customHeight) {
            x = (parseFloat(customLeft) / 100) * pdfWidth;
            y = (parseFloat(customTop) / 100) * pdfHeight;
            w = (parseFloat(customWidth) / 100) * pdfWidth;
            h = (parseFloat(customHeight) / 100) * pdfHeight;
          } else {
            const elRect = el.getBoundingClientRect();
            x = ((elRect.left - pageRect.left) / pageRect.width) * pdfWidth;
            y = ((elRect.top - pageRect.top) / pageRect.height) * pdfHeight;
            w = (elRect.width / pageRect.width) * pdfWidth;
            h = (elRect.height / pageRect.height) * pdfHeight;
          }

          if (w > 0 && h > 0) {
            pdf.link(x, y, w, h, { url: href });
          }
        });
      }
    }

    const cleanNumber = quotationNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    const cleanClient = (clientName || "Customer").replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `Quotation_${cleanNumber || "QUO-2026-001"}_${cleanClient}.pdf`;

    pdf.save(filename);
    toast.success(`Downloaded ${filename} successfully!`, { id: toastId });
  } catch (err) {
    console.error("PDF generation error:", err);
    toast.error("Failed to generate PDF. You can also use the Print button to Save as PDF.", {
      id: toastId,
    });
  } finally {
    // Restore Canvas prototypes and getComputedStyle
    restoreMainWindowCanvas();
    restoreClonedWindowCanvas();

    if (typeof window !== "undefined" && originalGetComputedStyle) {
      window.getComputedStyle = originalGetComputedStyle;
    }
  }
}

export function printQuotationDocument(): void {
  window.print();
}
