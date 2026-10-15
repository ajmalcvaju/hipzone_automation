"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getQuotationById } from "@/services/quotations";
import { Quotation } from "@/types";
import { QuotationBuilder } from "@/components/quotations/QuotationBuilder";
import { downloadQuotationPDF } from "@/lib/pdf/export";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditQuotationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const autoDownload = searchParams?.get("download") === "true";

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const found = await getQuotationById(id);
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
        console.error(err);
        toast.error("Failed to load quotation");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router, autoDownload]);

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
        <p>Loading quotation document...</p>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

  return <QuotationBuilder initialQuotation={quotation} />;
}
