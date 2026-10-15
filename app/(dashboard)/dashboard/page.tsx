"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getProducts } from "@/services/products";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  Package,
  Layers,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  Database,
  Search,
  Tag,
  CheckCircle2,
  TrendingUp,
  FileText,
} from "lucide-react";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isCloud = isFirebaseConfigured();

  useEffect(() => {
    async function loadData() {
      try {
        const prodList = await getProducts();
        setProducts(prodList);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const totalProducts = products.length;
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const totalCatalogValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [products, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalog Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, organize, and synchronize enterprise smart automation products for Hipzone Automation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </Link>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>All Quotations</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs transition-all"
          >
            <Package className="w-4 h-4" />
            <span>Catalog</span>
          </Link>
          <Link
            href="/products/import"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {isLoading ? "—" : totalProducts}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Catalog items stored</span>
            <Link
              href="/products"
              className="text-[#0099e5] hover:underline font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Categories */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Categories
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {isLoading ? "—" : categories.length}
          </p>
          <div className="mt-3 text-xs text-slate-500">
            <span>Product classifications</span>
          </div>
        </div>

        {/* Card 3: Total Catalog Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cumulative Price
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">
            {isLoading ? "—" : formatCurrency(totalCatalogValue, "INR")}
          </p>
          <div className="mt-3 text-xs text-slate-500">
            <span>Sum of unit prices</span>
          </div>
        </div>

        {/* Card 4: Database Sync Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Storage Backend
            </span>
            <div className={`p-2 rounded-lg ${isCloud ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-3 flex items-center gap-2">
            {isCloud ? "Cloud Firestore" : "Local Database"}
          </p>
          <div className="mt-3 text-xs text-slate-500">
            <span>{isCloud ? "Connected & Synchronized" : "Local Persistent Cache"}</span>
          </div>
        </div>
      </div>

      {/* Catalog Quick Browse Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Catalog Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse products stored in your Firebase collection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0099e5]"
              />
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-[#0099e5] hover:text-[#007bb5] shrink-0 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Import your product catalog from Excel (.xlsx or .xls) to get started.
            </p>
            <Link
              href="/products/import"
              className="mt-4 inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Item Code</th>
                  <th className="py-3 px-5">Product Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5 text-right">Unit Price</th>
                  <th className="py-3 px-5 text-center">HSN Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                      {prod.itemCode || "—"}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{prod.name}</div>
                      {prod.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                          {prod.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {prod.category || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                      {formatCurrency(prod.price, "INR")}
                    </td>
                    <td className="py-3.5 px-5 text-center text-slate-600 font-mono">
                      {prod.hsn || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
