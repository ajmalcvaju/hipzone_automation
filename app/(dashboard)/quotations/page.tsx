"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getQuotations, deleteQuotation, duplicateQuotation } from "@/services/quotations";
import { Quotation, QuotationStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { downloadQuotationPDF } from "@/lib/pdf/export";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  Edit,
  Download,
  Calendar,
  User,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function AllQuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const list = await getQuotations();
      setQuotations(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quotation deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quotation");
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const copy = await duplicateQuotation(id);
      if (copy) {
        toast.success(`Duplicated as ${copy.quotationNumber}`);
        router.push(`/quotations/${copy.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate quotation");
    }
  };

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.client?.phone && q.client.phone.includes(searchQuery));

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "expired":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, manage, and download professional 9-page Hipzone Automation quotations
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-2 bg-[#0077b6] hover:bg-[#0096c7] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quote number, client name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0077b6]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#0077b6]"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading quotations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first quotation with the 9-page Hipzone Automation master PDF template.
            </p>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 bg-[#0077b6] hover:bg-[#0096c7] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Quote Number</th>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Pages / Tables</th>
                  <th className="py-3 px-5 text-right">Grand Total</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    onClick={() => router.push(`/quotations/${quote.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-[#0077b6] group-hover:underline">
                      {quote.quotationNumber}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-900">
                      <div>{quote.client?.name || "Untitled Client"}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {quote.client?.phone || quote.client?.address || "No contact info"}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      <div>{quote.quotationDate}</div>
                      <div className="text-[10px] text-slate-400">Valid: {quote.validUntil}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {quote.pages?.length || 1} Pages
                      </span>{" "}
                      •{" "}
                      <span>
                        {quote.pages?.reduce((acc, p) => acc + (p.tables?.length || 0), 0) || 0} Tables
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-slate-900 font-mono text-sm">
                      {formatCurrency(quote.grandTotal, quote.currency || "INR")}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                          quote.status
                        )}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/quotations/${quote.id}`);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#0077b6] hover:bg-slate-100 rounded transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(quote.id, e)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Duplicate Quotation"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/quotations/${quote.id}?download=true`);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(quote.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
