import { Suspense } from "react";
import { EditQuotationClient } from "@/components/quotations/EditQuotationClient";
import { Loader2 } from "lucide-react";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function EditQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0077b6] mb-3" />
          <p>Loading quotation document...</p>
        </div>
      }
    >
      <EditQuotationClient />
    </Suspense>
  );
}
