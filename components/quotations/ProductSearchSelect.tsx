"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Product } from "@/types";
import { Search, ChevronDown, Check, X, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductSearchSelectProps {
  products: Product[];
  selectedProductId?: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
}

export function ProductSearchSelect({
  products,
  selectedProductId,
  onSelect,
  placeholder = "-- Search or Select Product --",
}: ProductSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Filter products by query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchPrice = p.price?.toString().includes(q);
      const matchCode = p.itemCode?.toLowerCase().includes(q);
      return matchName || matchCat || matchDesc || matchPrice || matchCode;
    });
  }, [products, searchQuery]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (prodId: string) => {
    onSelect(prodId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full px-3 py-2 text-xs rounded-lg border bg-white flex items-center justify-between gap-2 cursor-pointer transition-all ${
          isOpen
            ? "border-[#0077b6] ring-2 ring-[#0077b6]/20 shadow-xs"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {selectedProduct ? (
            <>
              {selectedProduct.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <Package className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-semibold text-slate-800 truncate">
                {selectedProduct.name}
              </span>
              <span className="text-emerald-600 font-bold font-mono text-[11px] shrink-0">
                ({formatCurrency(selectedProduct.price)})
              </span>
            </>
          ) : (
            <span className="text-slate-400 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedProduct && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              title="Clear product selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-[#0077b6]" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, price, model..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0077b6] text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-500 font-medium">
              <span>{filteredProducts.length} product(s) found</span>
              {searchQuery && <span>Filtered by &quot;{searchQuery}&quot;</span>}
            </div>
          </div>

          {/* Product Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {/* Custom / Clear option */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("")}
              className={`p-2.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                !selectedProductId ? "bg-blue-50/60 font-semibold text-[#0077b6]" : "text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 italic">-- Custom / Manual Item --</span>
              </div>
              {!selectedProductId && <Check className="w-3.5 h-3.5 text-[#0077b6]" />}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <Package className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No products found</p>
                <p className="text-[11px] text-slate-400">
                  Try searching with a different keyword or name
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(p.id)}
                    className={`p-2.5 text-xs flex items-center justify-between gap-3 hover:bg-blue-50/80 cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50 font-bold text-[#0077b6]" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                      {p.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-8 h-8 rounded-md object-cover border border-slate-200 bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="overflow-hidden min-w-0">
                        <div className="font-semibold truncate text-slate-900">{p.name}</div>
                        {p.category && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-emerald-600 text-xs">
                        {formatCurrency(p.price)}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#0077b6]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
