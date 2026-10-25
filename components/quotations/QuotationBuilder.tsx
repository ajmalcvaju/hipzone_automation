"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Quotation,
  Product,
  CompanySettings,
  TableType,
  QuotationTable,
  QuotationPage,
  QuotationTableItem,
} from "@/types";
import { getProducts } from "@/services/products";
import { getCompanySettings } from "@/services/settings";
import { saveQuotation, generateNextQuotationNumber } from "@/services/quotations";
import { compressImageTo25KB } from "@/services/storage";
import { HipzoneQuotationDocument } from "@/components/quotation-document/HipzoneQuotationDocument";
import { downloadQuotationPDF, printQuotationDocument } from "@/lib/pdf/export";
import { generateId, computeQuotationTotals } from "@/lib/utils";
import { ProductSearchSelect } from "./ProductSearchSelect";
import { toast } from "sonner";
import {
  FileText,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Download,
  Printer,
  Eye,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Calculator,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";

interface QuotationBuilderProps {
  initialQuotation?: Quotation | null;
}

export function QuotationBuilder({ initialQuotation }: QuotationBuilderProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [quotation, setQuotation] = useState<Quotation | null>(initialQuotation || null);
  const [isSaving, setIsSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | undefined>(undefined);
  const [previewScale, setPreviewScale] = useState(0.75);
  const [activeTab, setActiveTab] = useState<"split" | "editor" | "preview">("split");

  // Load products and initialize empty quotation if new
  useEffect(() => {
    async function init() {
      const prodList = await getProducts();
      setProducts(prodList);

      const fetchedSettings = await getCompanySettings();
      setCompanySettings(fetchedSettings);

      if (!initialQuotation) {
        const settings = fetchedSettings;
        const nextNumber = await generateNextQuotationNumber();
        const today = new Date().toISOString().split("T")[0];
        const validDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Initial page starts empty (0 tables, 0 products) as requested
        const defaultPage: QuotationPage = {
          id: generateId("page"),
          pageNumber: 1,
          tables: [],
        };

        const initialSubtotal = 0;
        const initialTaxRate = 18;
        const initialTaxAmount = 0;

        const newQuote: Quotation = {
          id: generateId("quote"),
          quotationNumber: nextNumber,
          quotationDate: today,
          validUntil: validDate,
          status: "draft",
          client: {
            name: "Mohammad Shafi",
            phone: "+91 9828281929",
            address: "NOORAHA CASTLE AMBILERY, STADIUM ROAD Kerala-673121 India",
            email: "shafi@example.com",
          },
          projectDescription: settings.defaultProjectDescription,
          taxRate: initialTaxRate,
          currency: "INR",
          salesContact: {
            name: "Sales Team",
            contact: "name@hipzoneautomatio",
            email: "name@hipzoneautomation.com",
          },
          technicalSupport: {
            phone: "+91 7012566008",
            email: "support@hipzoneautomat",
          },
          termsAndConditions: settings.defaultTerms,
          paymentTerms: settings.defaultPaymentTerms,
          pricingTerms: settings.defaultCancellationPolicy,
          cancellationPolicy: settings.defaultCancellationPolicy,
          pages: [defaultPage],
          subtotal: initialSubtotal,
          taxAmount: 0, // matching sample where standard tax (18%) shows 0 GST initially or calculated
          grandTotal: initialSubtotal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setQuotation(newQuote);
      }
    }

    init();
  }, [initialQuotation]);

  // Recalculate quotation totals whenever pages or items change
  const recalculateTotals = (pages: QuotationPage[], taxRate: number) => {
    return computeQuotationTotals(pages, taxRate);
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quotation]);

  const handleSave = async () => {
    if (!quotation) return;
    setIsSaving(true);
    try {
      await saveQuotation(quotation);
      toast.success("Quotation saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save quotation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (!confirm("Are you sure you want to reset all data to defaults?")) return;
    window.location.reload();
  };

  // Page Management
  const handleAddPage = () => {
    if (!quotation) return;
    const newPageNumber = quotation.pages.length + 1;
    const newPage: QuotationPage = {
      id: generateId("page"),
      pageNumber: newPageNumber,
      tables: [],
    };
    const updatedPages = [...quotation.pages, newPage];
    setQuotation({ ...quotation, pages: updatedPages });
    toast.success(`Page ${newPageNumber} added`);
  };

  const handleRemovePage = (pageId?: string) => {
    if (!quotation || quotation.pages.length <= 1) {
      toast.info("At least one page is required");
      return;
    }
    const targetId = pageId || quotation.pages[quotation.pages.length - 1].id;
    const updatedPages = quotation.pages
      .filter((p) => p.id !== targetId)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
    toast.info("Page removed");
  };

  // Table Management
  const handleAddTable = (pageId: string, type: TableType) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        const tableNum = p.tables.length + 1;
        const newTable: QuotationTable = {
          id: generateId("table"),
          title: `Table ${tableNum}`,
          type: type,
          items: [],
        };
        return { ...p, tables: [...p.tables, newTable] };
      }
      return p;
    });
    setQuotation({ ...quotation, pages: updatedPages });
    toast.success(`Added ${type} table`);
  };

  const handleRemoveTable = (pageId: string, tableId: string) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.filter((t) => t.id !== tableId),
        };
      }
      return p;
    });
    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
    toast.info("Table removed");
  };

  const handleUpdateTableTitle = (pageId: string, tableId: string, title: string) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => (t.id === tableId ? { ...t, title } : t)),
        };
      }
      return p;
    });
    setQuotation({ ...quotation, pages: updatedPages });
  };

  // Item Management inside Table
  const handleAddItem = (pageId: string, tableId: string) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => {
            if (t.id === tableId) {
              const newItem: QuotationTableItem = {
                id: generateId("item"),
                name: "New Product",
                qty: 1,
                price: 0,
                total: 0,
                taxPercent: quotation.taxRate ?? 18,
                taxAmount: 0,
              };
              return { ...t, items: [...t.items, newItem] };
            }
            return t;
          }),
        };
      }
      return p;
    });
    setQuotation({ ...quotation, pages: updatedPages });
  };

  const handleDuplicateItem = (pageId: string, tableId: string, itemId: string) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => {
            if (t.id === tableId) {
              const idx = t.items.findIndex((it) => it.id === itemId);
              if (idx !== -1) {
                const src = t.items[idx];
                const copy: QuotationTableItem = {
                  ...src,
                  id: generateId("item"),
                  name: `${src.name} (Copy)`,
                };
                const newItems = [...t.items];
                newItems.splice(idx + 1, 0, copy);
                return { ...t, items: newItems };
              }
            }
            return t;
          }),
        };
      }
      return p;
    });
    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
    toast.success("Item duplicated");
  };

  const handleRemoveItem = (pageId: string, tableId: string, itemId: string) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => {
            if (t.id === tableId) {
              return {
                ...t,
                items: t.items.filter((it) => it.id !== itemId),
              };
            }
            return t;
          }),
        };
      }
      return p;
    });
    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
  };

  const handleUpdateItem = (
    pageId: string,
    tableId: string,
    itemId: string,
    field: keyof QuotationTableItem,
    val: any
  ) => {
    if (!quotation) return;
    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => {
            if (t.id === tableId) {
              return {
                ...t,
                items: t.items.map((it) => {
                  if (it.id === itemId) {
                    const updated = { ...it, [field]: val };
                    // Recalculate item totals
                    const qty = field === "qty" ? Math.max(0, Number(val) || 0) : it.qty;
                    const price = field === "price" ? Math.max(0, Number(val) || 0) : it.price;
                    const taxPct =
                      field === "taxPercent"
                        ? Number(val) || 0
                        : it.taxPercent ?? quotation.taxRate ?? 18;

                    const itemSubtotal = qty * price;
                    const itemTax = (itemSubtotal * taxPct) / 100;
                    updated.total = t.type === "7-col" ? itemSubtotal + itemTax : itemSubtotal;
                    updated.taxAmount = itemTax;
                    return updated;
                  }
                  return it;
                }),
              };
            }
            return t;
          }),
        };
      }
      return p;
    });

    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
  };

  const handleSelectProduct = (pageId: string, tableId: string, itemId: string, prodId: string) => {
    if (!quotation) return;

    if (!prodId) {
      const updatedPages = quotation.pages.map((p) => {
        if (p.id === pageId) {
          return {
            ...p,
            tables: p.tables.map((t) => {
              if (t.id === tableId) {
                return {
                  ...t,
                  items: t.items.map((it) => {
                    if (it.id === itemId) {
                      return {
                        ...it,
                        productId: undefined,
                      };
                    }
                    return it;
                  }),
                };
              }
              return t;
            }),
          };
        }
        return p;
      });
      setQuotation({ ...quotation, pages: updatedPages });
      return;
    }

    const selected = products.find((p) => p.id === prodId);
    if (!selected) return;

    const updatedPages = quotation.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          tables: p.tables.map((t) => {
            if (t.id === tableId) {
              return {
                ...t,
                items: t.items.map((it) => {
                  if (it.id === itemId) {
                    const qty = it.qty || 1;
                    const price = selected.price || 0;
                    const taxPct = it.taxPercent ?? quotation.taxRate ?? 18;
                    const itemSubtotal = qty * price;
                    const itemTax = (itemSubtotal * taxPct) / 100;

                    return {
                      ...it,
                      productId: selected.id,
                      name: selected.name,
                      description: selected.description || selected.name,
                      price: price,
                      imageUrl: selected.imageUrl || "",
                      total: t.type === "7-col" ? itemSubtotal + itemTax : itemSubtotal,
                      taxAmount: itemTax,
                    };
                  }
                  return it;
                }),
              };
            }
            return t;
          }),
        };
      }
      return p;
    });

    const { subtotal, taxAmount, grandTotal } = recalculateTotals(updatedPages, quotation.taxRate);
    setQuotation({
      ...quotation,
      pages: updatedPages,
      subtotal,
      taxAmount,
      grandTotal,
    });
    toast.success(`Selected ${selected.name}`);
  };

  if (!quotation) {
    return (
      <div className="p-20 text-center text-slate-400 text-sm">
        Initializing Hipzone Quotation Studio...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Top Studio Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {quotation.quotationNumber}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {quotation.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {quotation.client?.name || "Client"} • {quotation.quotationDate}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("split")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "split" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "editor" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Form Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "preview" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PDF Preview
          </button>
        </div>

        {/* Actions & Zoom */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center border border-slate-200 rounded-lg bg-slate-50 px-1 py-1 mr-2 text-xs">
            <button
              type="button"
              onClick={() => setPreviewScale((prev) => Math.max(0.4, prev - 0.1))}
              className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-slate-700">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setPreviewScale((prev) => Math.min(1.2, prev + 0.1))}
              className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => printQuotationDocument()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => downloadQuotationPDF(quotation.quotationNumber, quotation.client?.name)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0077b6] hover:bg-[#0088d1] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            LEFT COLUMN: THE EXACT INVOICE FORM (Screenshots 1 - 4)
            ======================================================== */}
        <div
          className={`space-y-6 ${
            activeTab === "preview"
              ? "hidden"
              : activeTab === "split"
              ? "lg:col-span-5 xl:col-span-5"
              : "col-span-12"
          }`}
        >
          {/* Main Form Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            {/* Top Form Header matching Screenshot 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Invoice Form</h2>
                  <p className="text-xs text-slate-500">Hipzone Automation Quotation Tool</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#ef4444] hover:bg-red-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Reset All Data
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#16a34a] hover:bg-green-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Changes (Ctrl+S)"}
                </button>
              </div>
            </div>

            {/* SECTION 1: CLIENT INFORMATION (Screenshot 1) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                CLIENT INFORMATION
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={quotation.client?.name || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        client: { ...quotation.client, name: e.target.value },
                      })
                    }
                    placeholder="e.g. Mohammad Shafi"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={quotation.client?.phone || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        client: { ...quotation.client, phone: e.target.value },
                      })
                    }
                    placeholder="+91 9828281929"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Client Address</label>
                <textarea
                  rows={2}
                  value={quotation.client?.address || ""}
                  onChange={(e) =>
                    setQuotation({
                      ...quotation,
                      client: { ...quotation.client, address: e.target.value },
                    })
                  }
                  placeholder="NOORAHA CASTLE AMBILERY, STADIUM ROAD Kerala-673121 India"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* SECTION 2: PROJECT DESCRIPTION (Screenshot 2) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                PROJECT DESCRIPTION
              </h3>
              <textarea
                rows={4}
                value={quotation.projectDescription || ""}
                onChange={(e) =>
                  setQuotation({ ...quotation, projectDescription: e.target.value })
                }
                className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-800 resize-none leading-relaxed"
              />
            </div>

            {/* SECTION 3: TAX & CURRENCY (Screenshot 2) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                TAX &amp; CURRENCY
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Standard Tax %</label>
                  <input
                    type="number"
                    value={quotation.taxRate ?? 18}
                    onChange={(e) => {
                      const newRate = parseFloat(e.target.value) || 0;
                      const { subtotal, taxAmount, grandTotal } = recalculateTotals(
                        quotation.pages,
                        newRate
                      );
                      setQuotation({
                        ...quotation,
                        taxRate: newRate,
                        subtotal,
                        taxAmount,
                        grandTotal,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Currency (INR)</label>
                  <select
                    value={quotation.currency || "INR"}
                    onChange={(e) => setQuotation({ ...quotation, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900 bg-white"
                  >
                    <option value="INR">INR</option>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4: SALES CONTACT (Screenshot 3) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                SALES CONTACT
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Sales Person Name</label>
                  <input
                    type="text"
                    value={quotation.salesContact?.name || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        salesContact: { ...quotation.salesContact, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Sales Person Contact</label>
                  <input
                    type="text"
                    value={quotation.salesContact?.contact || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        salesContact: { ...quotation.salesContact, contact: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: TECHNICAL SUPPORT (Screenshot 3) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                TECHNICAL SUPPORT
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Support Number</label>
                  <input
                    type="text"
                    value={quotation.technicalSupport?.phone || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        technicalSupport: {
                          ...quotation.technicalSupport,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Support Email</label>
                  <input
                    type="text"
                    value={quotation.technicalSupport?.email || ""}
                    onChange={(e) =>
                      setQuotation({
                        ...quotation,
                        technicalSupport: {
                          ...quotation.technicalSupport,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: TERMS & CONDITIONS (Screenshot 4) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                TERMS &amp; CONDITIONS
              </h3>
              <textarea
                rows={4}
                value={quotation.termsAndConditions || ""}
                onChange={(e) =>
                  setQuotation({ ...quotation, termsAndConditions: e.target.value })
                }
                className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-800 resize-none leading-relaxed"
              />
            </div>

            {/* SECTION 7: PAYMENT TERMS (Screenshot 4) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0077b6] uppercase tracking-wide border-b border-blue-100 pb-2">
                PAYMENT TERMS
              </h3>
              <textarea
                rows={4}
                value={quotation.paymentTerms || ""}
                onChange={(e) =>
                  setQuotation({ ...quotation, paymentTerms: e.target.value })
                }
                className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-800 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* ========================================================
              SECTION: PAGE MANAGEMENT (Prompt 3 Image 1)
              ======================================================== */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Page Management</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddPage}
                className="px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                + Add Page
              </button>
              <button
                type="button"
                onClick={() => handleRemovePage()}
                disabled={quotation.pages.length <= 1}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  quotation.pages.length > 1
                    ? "bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                — Remove Page
              </button>
            </div>
          </div>

          {/* ========================================================
              DYNAMIC PAGES & TABLES (Prompt 3 & 4 Screenshots)
              ======================================================== */}
          {quotation.pages.map((pg) => {
            // Calculate page subtotal
            const pageTotal = pg.tables.reduce((acc, t) => {
              return acc + t.items.reduce((sum, it) => sum + (it.total || it.qty * it.price), 0);
            }, 0);

            return (
              <div
                key={pg.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4"
              >
                {/* Page Card Header matching Prompt 3 Image 2 */}
                <div
                  className="px-5 py-3 text-white flex items-center justify-between"
                  style={{
                    background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Page {pg.pageNumber}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    {pg.tables.length} Tables
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Add Table Type Section (Prompt 3 Image 2) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Add Table Type</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddTable(pg.id, "2-col")}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>2-Column (Item, Price)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddTable(pg.id, "4-col")}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>4-Column (Item, Qty, Price, Total)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddTable(pg.id, "7-col")}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>7-Column (Full Invoice)</span>
                      </button>
                    </div>
                  </div>

                  {/* Empty state if no tables added yet */}
                  {pg.tables.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                      <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No tables yet</p>
                      <p className="text-xs text-slate-400">
                        Add a table to start creating your invoice
                      </p>
                    </div>
                  ) : (
                    /* Active Tables List matching Prompt 3 Image 3 & Prompt 4 */
                    pg.tables.map((table) => {
                      const tableTotal = table.items.reduce(
                        (acc, it) => acc + (it.total || it.qty * it.price),
                        0
                      );

                      return (
                        <div
                          key={table.id}
                          className="rounded-xl border border-slate-300 overflow-hidden shadow-xs"
                        >
                          {/* Table Header Bar matching Prompt 3 Image 3 */}
                          <div className="bg-white p-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <LayoutGrid className="w-4 h-4 text-slate-500 shrink-0" />
                              <input
                                type="text"
                                value={table.title}
                                onChange={(e) =>
                                  handleUpdateTableTitle(pg.id, table.id, e.target.value)
                                }
                                className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0077b6] focus:outline-none px-1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                {table.type === "2-col"
                                  ? "Simple"
                                  : table.type === "7-col"
                                  ? "Full Invoice"
                                  : "Standard"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTable(pg.id, table.id)}
                                className="px-2.5 py-1 rounded bg-[#fee2e2] hover:bg-rose-100 text-[#ef4444] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Dark Product Container matching Prompt 3 Image 3 & Prompt 4 */}
                          <div className="bg-black p-4 space-y-4">
                            {table.items.length === 0 ? (
                              <div className="p-8 text-center text-white space-y-2">
                                <ShoppingBag className="w-10 h-10 text-slate-500 mx-auto" />
                                <p className="text-sm font-bold">No products added yet</p>
                                <p className="text-xs text-slate-400">
                                  Click Add Product to get started
                                </p>
                              </div>
                            ) : (
                              table.items.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="bg-white rounded-xl p-4 shadow-sm space-y-3 relative text-slate-900 border border-slate-200"
                                >
                                  {/* Item Header Controls: Duplicate & Delete */}
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800">
                                      Select Product
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateItem(pg.id, table.id, item.id)}
                                        className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                        title="Duplicate item"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(pg.id, table.id, item.id)}
                                        className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                        title="Delete item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Searchable Product Dropdown */}
                                  <ProductSearchSelect
                                    products={products}
                                    selectedProductId={item.productId}
                                    onSelect={(prodId) =>
                                      handleSelectProduct(pg.id, table.id, item.id, prodId)
                                    }
                                  />

                                  {item.imageUrl && (
                                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/60 border border-blue-200/80">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-10 h-10 rounded-md object-cover border border-blue-300 bg-white shrink-0"
                                      />
                                      <div className="text-[11px] text-blue-900 leading-tight">
                                        <span className="font-semibold block">Product Image Attached</span>
                                        <span className="text-slate-500 text-[10px]">Displayed automatically in table</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* TYPE 1: 2-COLUMN FORM (Prompt 4 Screenshot 1) */}
                                  {table.type === "2-col" ? (
                                    <>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">
                                          Product Name <span className="text-emerald-600">(*)</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(e) =>
                                            handleUpdateItem(pg.id, table.id, item.id, "name", e.target.value)
                                          }
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">
                                          Price
                                        </label>
                                        <input
                                          type="number"
                                          value={item.price}
                                          onChange={(e) =>
                                            handleUpdateItem(
                                              pg.id,
                                              table.id,
                                              item.id,
                                              "price",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                                        />
                                      </div>
                                    </>
                                  ) : table.type === "7-col" ? (
                                    /* TYPE 3: 7-COLUMN FORM (Prompt 4 Screenshot 3) */
                                    <>
                                      <div className="grid grid-cols-[100px_1fr] gap-3">
                                        <div>
                                          <label className="block text-xs font-bold text-slate-800 mb-1">
                                            S.No <span className="text-blue-600 font-normal">(Smart Auto)</span>
                                          </label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={idx + 1}
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-blue-600 font-bold text-center"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-bold text-slate-800 mb-1">
                                            Product Name <span className="text-emerald-600">(*)</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              handleUpdateItem(pg.id, table.id, item.id, "name", e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">
                                          Description <span className="text-emerald-600">(*)</span>
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={item.description || ""}
                                          placeholder="Enter product description"
                                          onChange={(e) =>
                                            handleUpdateItem(pg.id, table.id, item.id, "description", e.target.value)
                                          }
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900 resize-none"
                                        />
                                      </div>

                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                            Quantity
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) =>
                                              handleUpdateItem(
                                                pg.id,
                                                table.id,
                                                item.id,
                                                "qty",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-center"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                            Unit Price
                                          </label>
                                          <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) =>
                                              handleUpdateItem(
                                                pg.id,
                                                table.id,
                                                item.id,
                                                "price",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-right"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                            Tax Rate (%)
                                          </label>
                                          <input
                                            type="number"
                                            value={item.taxPercent ?? 5}
                                            onChange={(e) =>
                                              handleUpdateItem(
                                                pg.id,
                                                table.id,
                                                item.id,
                                                "taxPercent",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-center"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
                                            Tax Amount
                                          </label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={(item.taxAmount || 0).toFixed(2)}
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-bold text-center"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-bold text-slate-900">
                                          Billing Price:
                                        </span>
                                        <span className="text-base font-extrabold text-[#059669] font-mono">
                                          {(item.total || 0).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    /* TYPE 2: 4-COLUMN FORM (Prompt 4 Screenshot 2) */
                                    <>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">
                                          Product Name <span className="text-emerald-600">(*)</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(e) =>
                                            handleUpdateItem(pg.id, table.id, item.id, "name", e.target.value)
                                          }
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900"
                                        />
                                      </div>

                                      <div className="grid grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs font-bold text-slate-800 mb-1">
                                            Quantity
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) =>
                                              handleUpdateItem(
                                                pg.id,
                                                table.id,
                                                item.id,
                                                "qty",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900 text-center"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-bold text-slate-800 mb-1">
                                            Price
                                          </label>
                                          <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) =>
                                              handleUpdateItem(
                                                pg.id,
                                                table.id,
                                                item.id,
                                                "price",
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0077b6] text-slate-900 text-right"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-bold text-slate-800 mb-1">
                                            Total
                                          </label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={(item.total || item.qty * item.price).toFixed(2)}
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 bg-purple-50 text-purple-700 font-bold text-center"
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))
                            )}

                            {/* + Add Product Button (Green) */}
                            <button
                              type="button"
                              onClick={() => handleAddItem(pg.id, table.id)}
                              className="px-4 py-2 rounded-lg bg-[#16a34a] hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Product</span>
                            </button>

                            {/* Table Total Blue Banner matching Prompt 4 Screenshot 4 */}
                            <div className="rounded-lg bg-[#eff6ff] border border-blue-200 px-4 py-2.5 flex items-center justify-between text-blue-900">
                              <div className="flex items-center gap-2 text-xs font-bold">
                                <Calculator className="w-4 h-4 text-blue-600" />
                                <span>Table Total:</span>
                              </div>
                              <span className="text-base font-extrabold font-mono text-blue-700">
                                {tableTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Page Total Green Banner matching Prompt 3 Image 3 */}
                  <div className="rounded-xl bg-[#f0fdf4] border border-emerald-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Calculator className="w-4 h-4 text-[#16a34a]" />
                      <span>Page Total:</span>
                    </div>
                    <span className="text-2xl font-black text-[#16a34a] font-mono">
                      {pageTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================
            RIGHT COLUMN: 9-PAGE MASTER PDF DOCUMENT PREVIEW
            ======================================================== */}
        <div
          className={`${
            activeTab === "editor"
              ? "hidden"
              : activeTab === "split"
              ? "lg:col-span-7 xl:col-span-7"
              : "col-span-12"
          }`}
        >
          {/* Helper Banner */}
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0077b6] shrink-0" />
              <span>
                <strong>Hipzone 9-Page Master PDF Reference:</strong> All pages synchronize in real time.
              </span>
            </div>
            <span className="font-semibold text-blue-700">Theme: Electric Cyan &amp; Black</span>
          </div>

          {/* Rendered Live Document */}
          <div className="bg-slate-950 py-8 px-2 sm:px-6 rounded-2xl border border-slate-800 shadow-2xl flex justify-center overflow-x-auto min-h-[800px]">
            <HipzoneQuotationDocument
              quotation={quotation}
              settings={companySettings}
              scale={previewScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
