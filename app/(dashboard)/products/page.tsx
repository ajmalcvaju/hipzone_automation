"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearDummyProducts,
} from "@/services/products";
import { uploadProductImage, compressImageTo25KB } from "@/services/storage";
import { Product } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "price-asc" | "price-desc">("newest");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<Product | null>(null);

  // Form input states
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [compressedSizeKB, setCompressedSizeKB] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      await clearDummyProducts();
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
          (p.hsn && p.hsn.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      // newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, searchQuery, sortBy, categoryFilter]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormDescription("");
    setFormCategory("");
    setFormImageFile(null);
    setFormImageUrl("");
    setCompressedSizeKB(null);
    setIsCompressing(false);
    setIsFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormDescription(product.description || "");
    setFormCategory(product.category || "");
    setFormImageFile(null);
    setFormImageUrl(product.imageUrl || "");
    setCompressedSizeKB(null);
    setIsCompressing(false);
    setIsFormOpen(true);
  };

  const handleImageChange = async (file: File) => {
    setIsCompressing(true);
    try {
      const res = await compressImageTo25KB(file);
      setFormImageFile(res.file);
      setFormImageUrl(res.dataUrl);
      setCompressedSizeKB(res.sizeKB);
      toast.success(`Image compressed to ${res.sizeKB} KB (Target: ≤ 25 KB)`);
    } catch (err) {
      console.warn("Direct compression notice:", err);
      setFormImageFile(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Product name is required");
      return;
    }
    const numPrice = parseFloat(formPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid, non-negative price");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = formImageUrl;
    let finalImagePath: string | undefined;

    try {
      if (formImageFile) {
        setUploadProgress(true);
        const uploadRes = await uploadProductImage(formImageFile);
        finalImageUrl = uploadRes.url;
        finalImagePath = uploadRes.path;
        setUploadProgress(false);
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName.trim(),
          price: numPrice,
          description: formDescription.trim(),
          category: formCategory.trim() || undefined,
          imageUrl: finalImageUrl || undefined,
          imagePath: finalImagePath || editingProduct.imagePath,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct({
          name: formName.trim(),
          price: numPrice,
          description: formDescription.trim(),
          category: formCategory.trim() || undefined,
          imageUrl: finalImageUrl || undefined,
          imagePath: finalImagePath,
          isActive: true,
        });
        toast.success("Product added successfully");
      }

      setIsFormOpen(false);
      loadProducts();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isDeleting) return;
    try {
      await deleteProduct(isDeleting.id);
      toast.success(`Deleted "${isDeleting.name}"`);
      setIsDeleting(null);
      loadProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your hardware inventory, automation components, and pricing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/products/import"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Excel Import</span>
          </Link>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, category, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="newest">Sort: Newest</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="price-asc">Sort: Price (Low to High)</option>
            <option value="price-desc">Sort: Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading product catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "No products match your search query."
                : "Your product catalog is currently empty. Add your first item or import an Excel spreadsheet."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
              <Link
                href="/products/import"
                className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bulk Import
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5 w-16 text-center">Image</th>
                    <th className="py-3 px-5">Product Details</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5 text-right">Price (₹)</th>
                    <th className="py-3 px-5">Created Date</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 text-center">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center mx-auto shrink-0">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 max-w-md">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        {(p.itemCode || p.hsn || p.stockQty !== undefined) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                            {p.itemCode && (
                              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                Code: {p.itemCode}
                              </span>
                            )}
                            {p.hsn && (
                              <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                HSN: {p.hsn}
                              </span>
                            )}
                            {p.stockQty !== undefined && (
                              <span className="text-slate-600 font-medium">
                                Stock: <strong>{p.stockQty}</strong>
                              </span>
                            )}
                          </div>
                        )}
                        {p.description && (
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {p.category ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 text-sm">
                        {formatCurrency(p.price, "INR")}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{formatDate(p.createdAt)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-cyan-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIsDeleting(p)}
                            title="Delete Product"
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
                {filteredProducts.length} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hikvision IP Video Door Phone System"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="28500"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. CCTV, GATE AUTOMATION"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed specifications, model number, inclusions..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Product Image (Compressed to ≤ 25 KB)
                  </label>
                  {compressedSizeKB !== null && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ {compressedSizeKB} KB (Ready for Firebase)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {formImageUrl && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formImageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isCompressing || isSubmitting}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageChange(e.target.files[0]);
                        }
                      }}
                      className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
                    />
                    {isCompressing && (
                      <p className="text-[11px] text-cyan-600 font-medium mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Compressing image into ≤ 25 KB...
                      </p>
                    )}
                    {!isCompressing && !compressedSizeKB && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Any photo (even 5MB WhatsApp/camera) will be compressed to ≤ 25 KB before adding to Firebase.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0099e5] hover:bg-[#0088d1] rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgress ? "Uploading Image..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Save Changes" : "Save Product"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <strong>&quot;{isDeleting.name}&quot;</strong>? This action
              cannot be undone. Previously saved quotations will retain their current item snapshots.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
