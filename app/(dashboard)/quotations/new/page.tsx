"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QuotationBuilder } from "@/components/quotations/QuotationBuilder";
import { getQuotationById } from "@/services/quotations";
import { Quotation } from "@/types";
import { Loader2 } from "lucide-react";

function NewQuotationInner() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [initialQuote, setInitialQuote] = useState<Quotation | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setInitialQuote(null);
      return;
    }
    getQuotationById(id)
      .then((q) => setInitialQuote(q || null))
      .catch(() => setInitialQuote(null));
  }, [id]);

  if (initialQuote === undefined) {
    return (
      <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
        <p>Loading quotation...</p>
      </div>
    );
  }

  return <QuotationBuilder initialQuotation={initialQuote} />;
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
          <p>Loading quotation...</p>
        </div>
      }
    >
      <NewQuotationInner />
    </Suspense>
  );
}
