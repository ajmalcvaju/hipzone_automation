"use client";

import React from "react";
import Link from "next/link";
import { Menu, FileSpreadsheet, Package, Database } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/client";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const isCloud = isFirebaseConfigured();

  return (
    <header
      id="dashboard-header"
      className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 tracking-tight hidden sm:inline">
            Hipzone Automation System
          </span>
          {isCloud ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Synced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Firebase env configuration pending - running in persistent offline local mode">
              <Database className="w-3 h-3" />
              Local Active
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all"
        >
          <span>+ New Quotation</span>
        </Link>
        <Link
          href="/quotations"
          className="hidden md:inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <span>Quotations</span>
        </Link>
        <Link
          href="/products/import"
          className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
        </Link>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-slate-500" />
          <span>Catalog</span>
        </Link>
      </div>
    </header>
  );
}
