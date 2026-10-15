"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { importProductsBulk } from "@/services/products";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ParsedRow {
  id: string;
  name: string;
  itemCode?: string;
  category?: string;
  hsn?: string;
  salePrice: number | string;
  purchasePrice?: number | string;
  discountType?: string;
  saleDiscount?: number | string;
  stockQty?: number | string;
  minStock?: number | string;
  description?: string;
  imageUrl?: string;
  isValid: boolean;
  errors: string[];
}

function parseNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return isNaN(val) ? undefined : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  if (!cleaned) return undefined;
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export default function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ added: number; failed: number } | null>(null);

  // Generate and download sample template matching user's exact 11-column format
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Item name*": "Industrial Smart Gateway Hub",
        "Item code": "HUB-ZIG-01",
        "Description": "Multi-protocol Zigbee 3.0 / Matter automation coordinator",
        "Category": "Controllers",
        "HSN": "85176290",
        "Sale price": 18500,
        "Purchase price": 13200,
        "Discount Type": "Percentage",
        "Sale Discount": 5,
        "Current stock qty": 45,
        "Minimum stock": 10,
      },
      {
        "Item name*": "Touch Screen Automation Panel 10 Inch",
        "Item code": "PANEL-10-POE",
        "Description": "High-resolution Android PoE wall touch control panel",
        "Category": "Touch Panels",
        "HSN": "85285900",
        "Sale price": 34000,
        "Purchase price": 25000,
        "Discount Type": "Percentage",
        "Sale Discount": 0,
        "Current stock qty": 20,
        "Minimum stock": 5,
      },
      {
        "Item name*": "Heavy Duty Automatic Gate Operator 800KG",
        "Item code": "GATE-OP-800",
        "Description": "Oil-bath motorized sliding gate mechanism with magnetic limits",
        "Category": "Motors & Actuators",
        "HSN": "84798999",
        "Sale price": 52000,
        "Purchase price": 39000,
        "Discount Type": "Amount",
        "Sale Discount": 2000,
        "Current stock qty": 12,
        "Minimum stock": 2,
      },
      {
        "Item name*": "4-Channel Smart Dimmer Module",
        "Item code": "DIM-4CH-AC",
        "Description": "Leading-edge / Trailing-edge phase cut smart dimmer",
        "Category": "Dimming & Lighting",
        "HSN": "85365020",
        "Sale price": 9200,
        "Purchase price": 6800,
        "Discount Type": "Percentage",
        "Sale Discount": 10,
        "Current stock qty": 60,
        "Minimum stock": 15,
      },
      {
        "Item name*": "Smart Motion & Lux Sensor Zigbee",
        "Item code": "SENS-PIR-01",
        "Description": "Wide angle dual-element passive infrared occupancy sensor",
        "Category": "Sensors",
        "HSN": "85437099",
        "Sale price": 3800,
        "Purchase price": 2600,
        "Discount Type": "Percentage",
        "Sale Discount": 0,
        "Current stock qty": 80,
        "Minimum stock": 20,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "Hipzone_Product_Import_Template.xlsx");
    toast.success("Downloaded Excel template");
  };

  // Handle file selection and parsing
  const handleFileUpload = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          toast.error("The spreadsheet appears to be empty.");
          setIsProcessing(false);
          return;
        }

        const rows: ParsedRow[] = rawJson.map((r, index) => {
          // Normalize column names by trimming, lowercasing, and stripping punctuation/asterisks
          const normalized: Record<string, any> = {};
          for (const [k, v] of Object.entries(r)) {
            const cleanKey = k.trim().toLowerCase().replace(/[\*\_\-]/g, " ").replace(/\s+/g, " ").trim();
            normalized[cleanKey] = v;
          }

          // Item Name (handles "Item name*", "Item Name", "Product Name", "Name")
          const name = String(
            normalized["item name"] ??
            normalized["product name"] ??
            normalized["name"] ??
            r["Item name*"] ??
            r["Item name"] ??
            r["Product Name"] ??
            ""
          ).trim();

          // Item Code (handles "Item code", "Item Code", "SKU", "Code")
          const itemCode = String(
            normalized["item code"] ??
            normalized["code"] ??
            normalized["sku"] ??
            r["Item code"] ??
            ""
          ).trim();

          // Description
          const description = String(
            normalized["description"] ??
            normalized["desc"] ??
            r["Description"] ??
            ""
          ).trim();

          // Category
          const category = String(
            normalized["category"] ??
            r["Category"] ??
            ""
          ).trim();

          // HSN
          const hsn = String(
            normalized["hsn"] ??
            normalized["hsn code"] ??
            normalized["hsn sac"] ??
            r["HSN"] ??
            ""
          ).trim();

          // Sale Price
          const rawSalePrice =
            normalized["sale price"] ??
            normalized["price"] ??
            normalized["unit price"] ??
            r["Sale price"] ??
            r["Sale price*"] ??
            r["Price"] ??
            "";
          const numSalePrice = parseNumber(rawSalePrice);

          // Purchase Price
          const rawPurchasePrice =
            normalized["purchase price"] ??
            r["Purchase price"] ??
            "";
          const numPurchasePrice = parseNumber(rawPurchasePrice);

          // Discount Type
          const discountType = String(
            normalized["discount type"] ??
            r["Discount Type"] ??
            ""
          ).trim();

          // Sale Discount
          const rawSaleDiscount =
            normalized["sale discount"] ??
            normalized["discount"] ??
            r["Sale Discount"] ??
            "";
          const numSaleDiscount = parseNumber(rawSaleDiscount);

          // Current Stock Qty
          const rawStockQty =
            normalized["current stock qty"] ??
            normalized["stock qty"] ??
            normalized["stock"] ??
            normalized["qty"] ??
            r["Current stock qty"] ??
            "";
          const numStockQty = parseNumber(rawStockQty);

          // Minimum Stock
          const rawMinStock =
            normalized["minimum stock"] ??
            normalized["min stock"] ??
            r["Minimum stock"] ??
            "";
          const numMinStock = parseNumber(rawMinStock);

          // Image URL (optional)
          const imageUrl = String(
            normalized["image url"] ??
            normalized["image"] ??
            r["Image URL"] ??
            r["Image"] ??
            ""
          ).trim();

          const errors: string[] = [];

          if (!name) {
            errors.push("Item name is required");
          }

          if (numSalePrice === undefined || numSalePrice < 0) {
            errors.push("Sale price must be a valid non-negative number");
          }

          if (imageUrl && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("data:")) {
            errors.push("Image URL must begin with http:// or https://");
          }

          return {
            id: `row_${index}_${Date.now()}`,
            name,
            itemCode: itemCode || undefined,
            category: category || undefined,
            hsn: hsn || undefined,
            salePrice: numSalePrice !== undefined ? numSalePrice : rawSalePrice,
            purchasePrice: numPurchasePrice,
            discountType: discountType || undefined,
            saleDiscount: numSaleDiscount,
            stockQty: numStockQty,
            minStock: numMinStock,
            description: description || undefined,
            imageUrl: imageUrl || undefined,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(rows);
        toast.success(`Parsed ${rows.length} rows from ${selectedFile.name}`);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast.error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid products to import.");
      return;
    }

    setIsImporting(true);
    try {
      const itemsToImport = validRows.map((r) => ({
        name: r.name,
        price: Number(r.salePrice),
        description: r.description,
        imageUrl: r.imageUrl,
        category: r.category,
        itemCode: r.itemCode,
        hsn: r.hsn,
        purchasePrice: typeof r.purchasePrice === "number" ? r.purchasePrice : undefined,
        discountType: r.discountType,
        saleDiscount: typeof r.saleDiscount === "number" ? r.saleDiscount : undefined,
        stockQty: typeof r.stockQty === "number" ? r.stockQty : undefined,
        minStock: typeof r.minStock === "number" ? r.minStock : undefined,
      }));

      const res = await importProductsBulk(itemsToImport);
      setImportSummary(res);
      toast.success(`Successfully imported ${res.added} products to database!`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Bulk import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/products" className="hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bulk Product Upload via Excel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your inventory and pricing catalog using your standard Excel export format.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Download Sample Template (.xlsx)</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 hover:border-cyan-500 transition-colors text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-50 text-[#0099e5] flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Select or drag &amp; drop your Excel file
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto">
          Supported file formats: <strong>.xlsx</strong> and <strong>.xls</strong>.
        </p>

        {/* Column schema chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-3xl mx-auto text-[11px]">
          <span className="font-semibold text-slate-600 mr-1">Supported Columns:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">Item name* (Req)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Item code</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Description</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Category</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">HSN</span>
          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">Sale price (Req)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Purchase price</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Discount Type</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Sale Discount</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Current stock qty</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Minimum stock</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <label className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Browse Excel File</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {file && (
          <p className="text-xs text-slate-600 font-medium mt-4">
            Selected file: <span className="font-bold text-slate-900">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Import Result / Summary banner */}
      {importSummary && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Bulk Import Completed Successfully
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Successfully added {importSummary.added} products to your catalog.
                {importSummary.failed > 0 && ` (${importSummary.failed} skipped/invalid)`}
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Go to Products Catalog
          </Link>
        </div>
      )}

      {/* Preview Table Section */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Data Validation Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review parsed products before importing into the database
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {validRows.length} Valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {invalidRows.length} Needs Attention
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={isImporting || validRows.length === 0}
                className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Products...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import {validRows.length} Products</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">Status</th>
                  <th className="py-3 px-3 min-w-[200px]">Item Name</th>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">HSN</th>
                  <th className="py-3 px-3 text-right">Sale Price</th>
                  <th className="py-3 px-3 text-right">Purchase Price</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 max-w-xs">Description</th>
                  <th className="py-3 px-3 text-right w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parsedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.isValid
                        ? "hover:bg-slate-50/80"
                        : "bg-rose-50/50 hover:bg-rose-50"
                    }
                  >
                    <td className="py-3 px-3 text-center">
                      {row.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{row.name || <span className="text-rose-500 italic">[Empty Name]</span>}</div>
                      {!row.isValid && (
                        <div className="text-[11px] text-rose-600 font-medium mt-1">
                          {row.errors.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {row.itemCode || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      {row.category ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px] font-medium">
                          {row.category}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {row.hsn || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {typeof row.salePrice === "number" ? `₹ ${row.salePrice.toLocaleString("en-IN")}` : String(row.salePrice)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {typeof row.purchasePrice === "number" ? `₹ ${row.purchasePrice.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.stockQty !== undefined ? (
                        <span className="font-semibold text-slate-800">{row.stockQty}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={row.description}>
                      {row.description || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        title="Remove Row"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
