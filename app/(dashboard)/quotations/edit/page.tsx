"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getQuotationById } from "@/services/quotations";
import { Quotation } from "@/types";
import { QuotationBuilder } from "@/components/quotations/QuotationBuilder";
import { downloadQuotationPDF } from "@/lib/pdf/export";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function EditQuotationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get("id");
  const autoDownload = searchParams?.get("download") === "true";

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let targetId = id;
      if (!targetId && typeof window !== "undefined") {
        const query = new URLSearchParams(window.location.search);
        targetId = query.get("id");
      }

      if (!targetId) {
        toast.error("No quotation ID specified");
        router.push("/quotations");
        return;
      }

      try {
        const found = await getQuotationById(targetId);
        if (found) {
          setQuotation(found);
          if (autoDownload) {
            setTimeout(() => {
              downloadQuotationPDF(found.quotationNumber, found.client?.name);
            }, 1000);
          }
        } else {
          toast.error("Quotation not found");
          router.push("/quotations");
        }
      } catch (err) {
        console.error("Failed to load quotation:", err);
        toast.error("Failed to load quotation");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [id, router, autoDownload]);

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
        <p>Loading quotation editor...</p>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

  return <QuotationBuilder initialQuotation={quotation} />;
}

export default function EditQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
          <p>Loading quotation editor...</p>
        </div>
      }
    >
      <EditQuotationInner />
    </Suspense>
  );
}
