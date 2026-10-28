"use client";

import React from "react";
import { Quotation, CompanySettings, QuotationTable } from "@/types";
import { formatCurrency, computeQuotationTotals } from "@/lib/utils";

export interface HipzoneQuotationDocumentProps {
  quotation: Quotation;
  settings?: CompanySettings;
  scale?: number;
  printMode?: boolean;
}

export function HipzoneQuotationDocument({
  quotation,
  settings,
  scale = 1,
  printMode = false,
}: HipzoneQuotationDocumentProps) {
  const currency = quotation.currency || "INR";
  const clientName = quotation.client?.name?.trim() || "Mohammad Shafi";
  const clientAddress =
    quotation.client?.address?.trim() ||
    "NOORAHA CASTLE AMBILERY, STADIUM ROAD Kerala-673121 India";
  const projectDesc =
    quotation.projectDescription?.trim() ||
    settings?.defaultProjectDescription?.trim() ||
    "HIPZONE AUTOMATION transforms homes and businesses into smarter, safer, and more intelligent spaces. With over 8 years of expertise in India and an expanding presence in Dubai, we deliver AI-integrated automation and security solutions powered by trusted global brands.\n\nOur intelligent systems go beyond standard automation. They learn your lifestyle, anticipate your needs, and optimize comfort, security, and energy efficiency automatically. We combine technical expertise with personalized service to ensure every project is reliable, future-ready, and supported by strong customer care.";

  // Calculate totals dynamically from tables
  const taxRate = quotation.taxRate ?? 18;
  const computedTotals =
    quotation.pages && quotation.pages.length > 0
      ? computeQuotationTotals(quotation.pages, taxRate)
      : {
          has7Col: false,
          taxableAmount: quotation.subtotal || 0,
          taxAmount: quotation.taxAmount || ((quotation.subtotal || 0) * taxRate) / 100,
          grandTotal:
            quotation.grandTotal ||
            (quotation.subtotal || 0) + ((quotation.subtotal || 0) * taxRate) / 100,
          subtotal: quotation.subtotal || 0,
        };

  const taxableAmount = computedTotals.taxableAmount;
  const taxAmount = computedTotals.taxAmount;
  const grandTotal = computedTotals.grandTotal;
  const subtotal = taxableAmount;

  // Sales Contact
  const salesName = quotation.salesContact?.name || settings?.defaultSalesContact?.name || "Sales Team";
  const salesContact =
    quotation.salesContact?.contact ||
    quotation.salesContact?.email ||
    settings?.defaultSalesContact?.contact ||
    "name@hipzoneautomation";

  // Technical Support
  const supportPhone =
    quotation.technicalSupport?.phone?.trim() ||
    settings?.defaultTechnicalSupport?.phone ||
    "+91 7012566008";
  const supportEmail =
    quotation.technicalSupport?.email?.trim() ||
    settings?.defaultTechnicalSupport?.email ||
    "support@hipzoneautomation.com";

  // Payment & Terms
  const paymentTerms =
    quotation.paymentTerms?.trim() ||
    settings?.defaultPaymentTerms ||
    "1. 25% – Upon order confirmation.\n2. 50% – Upon marking automation points and providing wiring drawings at the site.\n3. 75% – Upon completion of range mapping and site testing (including verification of electrical components, switch-boxes, lights, and automation provisions).\n4. 100% – Prior to dispatch of materials.";

  const pricingTerms =
    quotation.pricingTerms?.trim() ||
    "All prices are inclusive of applicable taxes.";

  const cancellationPolicy =
    quotation.cancellationPolicy?.trim() ||
    settings?.defaultCancellationPolicy ||
    "Any advance paid will be refunded if cancellation is made within 3 days of payment. After this period, the advance is non-refundable.";

  const termsAndConditions =
    quotation.termsAndConditions?.trim() ||
    settings?.defaultTerms ||
    "Thank you for your interest in Hipzone Automation India. We are committed to delivering innovative and reliable home automation solutions. Please review the following terms and conditions\n\nPrices: All prices are quoted in INR (Indian Rupees) and are inclusive of applicable taxes, unless otherwise specified\n\nValidity: This proposal remains valid for 30 days from the date of issue.\n\nInstallation: The proposal does not include costs for additional wiring, alterations, or modifications required at the time of installation.\n\nMobile Application: The Hipzone mobile app is free of charge and can be installed on multiple devices.";

  // Page styling - Exact A4: 210mm x 297mm
  const pageClass = `quotation-page relative w-[210mm] min-h-[297mm] h-[297mm] mx-auto bg-[#000000] text-white flex flex-col justify-between overflow-hidden box-border shadow-2xl print:shadow-none print:m-0 print:border-none print:w-[210mm] print:h-[297mm] ${
    printMode ? "" : "mb-8 border border-slate-800"
  }`;

  // Electric Cyan gradient banner header matching reference screenshots
  const CyanBanner = ({ title }: { title: string }) => (
    <div
      className="w-full h-10 rounded-lg flex items-center px-5 mb-4 shadow-md bg-[#0077b6]"
      style={{
        backgroundColor: "#0077b6",
        backgroundImage: "linear-gradient(90deg, #0077b6 0%, #0096c7 35%, #00b4d8 65%, #03045e 100%)",
      }}
    >
      <span className="text-base font-bold text-white tracking-wide font-sans">{title}</span>
    </div>
  );

  // Geometric Cyan Diamonds Watermark for bottom-right corner
  const CyanDiamondPattern = () => (
    <div className="absolute right-0 bottom-6 w-52 h-52 pointer-events-none opacity-40 z-0">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="140" y="40" width="35" height="35" transform="rotate(45 140 40)" stroke="#00b4d8" strokeWidth="1.5" />
        <rect x="110" y="80" width="45" height="45" transform="rotate(45 110 80)" stroke="#0077b6" strokeWidth="1.5" />
        <rect x="160" y="100" width="30" height="30" transform="rotate(45 160 100)" stroke="#00b4d8" strokeWidth="1.5" />
        <rect x="130" y="140" width="40" height="40" transform="rotate(45 130 140)" stroke="#0096c7" strokeWidth="1.5" />
        <rect x="80" y="130" width="25" height="25" transform="rotate(45 80 130)" stroke="#00b4d8" strokeWidth="1.2" />
        <rect x="50" y="160" width="30" height="30" transform="rotate(45 50 160)" stroke="#0077b6" strokeWidth="1.2" />
      </svg>
    </div>
  );

  // Branded Footer
  const BrandedFooter = () => (
    <div className="relative z-10 w-full border-t border-slate-800/80 pt-3 pb-3 px-8 flex items-center justify-between text-[11px] text-slate-400 font-sans">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hipzone-logo.png"
          alt="Hipzone Automation"
          className="h-6 w-auto object-contain block"
        />
      </div>
      <a
        href="https://hipzoneautomation.com"
        target="_blank"
        rel="noopener noreferrer"
        data-pdf-link="https://hipzoneautomation.com"
        className="text-[#00b4d8] font-medium hover:underline hover:text-cyan-300 transition-colors cursor-pointer"
        title="Visit www.hipzoneautomation.com"
      >
        www.hipzoneautomation.com
      </a>
    </div>
  );

  // Render Category Table matching reference screenshot 4 (e.g. CCTV)
  const renderTable = (table: QuotationTable) => {
    const tableSubtotal = table.items.reduce(
      (sum, it) => sum + (it.total || (it.qty ? it.qty * it.price : it.price) || 0),
      0
    );

    return (
      <div key={table.id} className="mb-6">
        <CyanBanner title={table.title || "CCTV"} />

        {table.type === "2-col" ? (
          <div className="rounded-lg border border-[#0077b6]/60 overflow-hidden bg-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#050608] border-b border-[#0077b6]/60 text-white font-bold">
                <tr>
                  <th className="py-3 px-4 w-[75%] border-r border-[#0077b6]/40">Item</th>
                  <th className="py-3 px-4 text-right w-[25%]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0077b6]/30">
                {table.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 text-white border-r border-[#0077b6]/30 font-medium">
                      <div className="flex items-center gap-3">
                        {it.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-11 h-11 rounded object-cover border border-[#0077b6]/50 bg-black shrink-0"
                          />
                        ) : null}
                        <div>
                          <div className="font-bold text-xs text-white uppercase leading-snug">
                            {it.name}
                          </div>
                          {it.description && it.description !== it.name && (
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                              {it.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white font-mono">
                      {formatCurrency(it.price, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#050608] border-t-2 border-[#0077b6]/70">
                  <td className="py-3 px-4 text-right font-bold text-white uppercase tracking-wider font-sans border-r border-[#0077b6]/40">
                    Sub Total:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-white font-mono text-sm">
                    {formatCurrency(tableSubtotal, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : table.type === "7-col" ? (
          <div className="rounded-lg border border-[#0077b6]/60 overflow-hidden bg-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#050608] border-b border-[#0077b6]/60 text-white font-bold">
                <tr>
                  <th className="py-2.5 px-2 text-center w-12 border-r border-[#0077b6]/40">S.No</th>
                  <th className="py-2.5 px-3 w-[25%] border-r border-[#0077b6]/40">Item</th>
                  <th className="py-2.5 px-3 flex-1 border-r border-[#0077b6]/40">Description</th>
                  <th className="py-2.5 px-2 text-center w-12 border-r border-[#0077b6]/40">Qty</th>
                  <th className="py-2.5 px-3 text-right w-20 border-r border-[#0077b6]/40">Unit Price</th>
                  <th className="py-2.5 px-2 text-center w-14 border-r border-[#0077b6]/40">Tax %</th>
                  <th className="py-2.5 px-3 text-right w-24">Billing Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0077b6]/30">
                {table.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 text-center text-slate-400 border-r border-[#0077b6]/30 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white border-r border-[#0077b6]/30">
                      <div className="flex items-center gap-2.5">
                        {it.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-9 h-9 rounded object-cover border border-[#0077b6]/50 bg-black shrink-0"
                          />
                        ) : null}
                        <span className="leading-tight">{it.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300 border-r border-[#0077b6]/30">
                      {it.description || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-white border-r border-[#0077b6]/30">
                      {it.qty}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 border-r border-[#0077b6]/30 font-mono">
                      {it.price}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 border-r border-[#0077b6]/30 font-mono">
                      {it.taxPercent ?? 5}%
                    </td>
                    <td
                      className="py-2.5 px-3 text-right font-bold text-white font-mono"
                      style={{ color: "#ffffff" }}
                    >
                      {formatCurrency(it.total || it.qty * it.price, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#050608] border-t-2 border-[#0077b6]/70">
                  <td colSpan={6} className="py-2.5 px-4 text-right font-bold text-white uppercase tracking-wider font-sans border-r border-[#0077b6]/40">
                    Sub Total:
                  </td>
                  <td
                    className="py-2.5 px-3 text-right font-black text-white font-mono text-sm"
                    style={{ color: "#ffffff" }}
                  >
                    {formatCurrency(tableSubtotal, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Standard 4-Column Table matching reference Screenshot 4 */
          <div className="rounded-lg border border-[#0077b6]/70 overflow-hidden bg-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#050608] border-b border-[#0077b6]/70 text-white font-bold">
                <tr>
                  <th className="py-3 px-4 w-[50%] border-r border-[#0077b6]/50 text-center uppercase tracking-wider">
                    Item
                  </th>
                  <th className="py-3 px-3 w-[15%] border-r border-[#0077b6]/50 text-center uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="py-3 px-3 w-[17%] border-r border-[#0077b6]/50 text-center uppercase tracking-wider">
                    Price
                  </th>
                  <th className="py-3 px-4 w-[18%] text-center uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0077b6]/40">
                {table.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 text-white border-r border-[#0077b6]/40">
                      <div className="flex items-center gap-3">
                        {it.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-11 h-11 rounded object-cover border border-[#0077b6]/50 bg-black shrink-0"
                          />
                        ) : null}
                        <div>
                          <div className="font-bold text-xs text-white uppercase leading-snug">
                            {it.name}
                          </div>
                          {it.description && it.description !== it.name && (
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                              {it.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-white border-r border-[#0077b6]/40 font-mono text-sm">
                      {it.qty}
                    </td>
                    <td className="py-3 px-3 text-center text-white border-r border-[#0077b6]/40 font-mono text-sm">
                      {it.price}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white font-mono text-sm">
                      {(it.total || it.qty * it.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#050608] border-t-2 border-[#0077b6]/70">
                  <td colSpan={3} className="py-3 px-4 text-right font-bold text-white uppercase tracking-wider font-sans border-r border-[#0077b6]/50">
                    Sub Total:
                  </td>
                  <td className="py-3 px-4 text-center font-black text-white font-mono text-sm">
                    {tableSubtotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="quotation-document-container"
      className="origin-top transition-transform"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
        fontFamily: 'Arial, Helvetica, sans-serif',
        letterSpacing: "0px",
      }}
    >
      {/* ========================================================
          PAGE 1: COVER PAGE
          ======================================================== */}
      <div className={pageClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hipzone-assets/hd_page_1.jpg"
          alt="Hipzone Automation Cover Page"
          className="w-full h-full object-cover block"
        />

        {/* Page 1 Website Link */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="3.8"
          data-pdf-top="93.2"
          data-pdf-width="29.0"
          data-pdf-height="2.8"
          title="Visit www.hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-1 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "93.2%",
            left: "3.8%",
            width: "29.0%",
            height: "2.8%",
          }}
        />
      </div>

      {/* ========================================================
          PAGE 2: ABOUT HIPZONE AUTOMATION
          ======================================================== */}
      <div className={pageClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hipzone-assets/hd_page_2.jpg"
          alt="About Hipzone Automation"
          className="w-full h-full object-cover block"
        />

        {/* Page 2 Website Link */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="68.0"
          data-pdf-top="95.0"
          data-pdf-width="28.0"
          data-pdf-height="2.8"
          title="Visit www.hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-1 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "95.0%",
            left: "68.0%",
            width: "28.0%",
            height: "2.8%",
          }}
        />
      </div>

      {/* ========================================================
          PAGE 3: CLIENT INFORMATION & PROJECT DESCRIPTION
          ======================================================== */}
      <div className={pageClass}>
        {CyanDiamondPattern()}

        <div className="relative z-10 flex-1 flex flex-col justify-between p-10">
          <div className="space-y-8 pt-4">
            {/* Section 1: Client Information */}
            <div>
              <CyanBanner title="Client Information" />
              <div className="px-3 py-2 space-y-3 text-sm font-sans">
                <div className="grid grid-cols-[100px_1fr] items-center">
                  <span className="font-bold text-white">Name:</span>
                  <span className="text-[#e2e8f0] font-semibold">{clientName}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-start">
                  <span className="font-bold text-white pt-0.5">Address:</span>
                  <span className="text-[#cbd5e1] font-medium whitespace-pre-line leading-relaxed">
                    {clientAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Project Description */}
            <div>
              <CyanBanner title="Project Description" />
              <div className="px-3 text-xs leading-relaxed text-[#cbd5e1] whitespace-pre-line space-y-3 font-sans">
                {projectDesc}
              </div>
            </div>
          </div>

          <BrandedFooter />
        </div>
      </div>

      {/* ========================================================
          PAGE 4: DYNAMIC PRODUCT / CATEGORY TABLES
          ======================================================== */}
      {quotation.pages && quotation.pages.length > 0 ? (
        quotation.pages.map((pg, pIdx) => (
          <div key={pg.id || pIdx} className={pageClass}>
            {CyanDiamondPattern()}

            <div className="relative z-10 flex-1 flex flex-col justify-between p-10">
              <div className="space-y-6 pt-4">
                {pg.tables && pg.tables.length > 0 ? (
                  pg.tables.map((table) => renderTable(table))
                ) : (
                  <div className="py-20 text-center font-sans">
                    <p className="text-slate-500 text-sm font-medium">
                      No product tables added to this page yet.
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Select 2-Column, 4-Column, or 7-Column in the Invoice Form to add products.
                    </p>
                  </div>
                )}
              </div>

              <BrandedFooter />
            </div>
          </div>
        ))
      ) : (
        /* Fallback sample page 4 */
        <div className={pageClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hipzone-assets/hd_page_4.jpg"
            alt="CCTV Table Page"
            className="w-full h-full object-cover block"
          />
        </div>
      )}

      {/* ========================================================
          PAGE 5: TAX SUMMARY, GRAND TOTAL & SALES CONTACT
          ======================================================== */}
      <div className={pageClass}>
        {CyanDiamondPattern()}

        <div className="relative z-10 flex-1 flex flex-col justify-between p-10">
          <div className="space-y-8 pt-4">
            {/* Top Brand Title */}
            <div className="text-center pt-2 pb-4">
              <h1 className="text-5xl font-black text-[#00a8e8] tracking-wider uppercase font-sans">
                HIPZONE
              </h1>
              <p className="text-xl font-bold text-white tracking-widest uppercase mt-1">
                AUTOMATION
              </p>
            </div>

            {/* Section 1: Tax Summary Table */}
            <div>
              <CyanBanner title="Tax Summary" />
              <div className="rounded-lg border border-[#0077b6]/70 overflow-hidden bg-black">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-[#050608] border-b border-[#0077b6]/70 text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-[#0077b6]/50">Tax Details</th>
                      <th className="py-2.5 px-3 border-r border-[#0077b6]/50">Taxable Amount (INR)</th>
                      <th className="py-2.5 px-3">Tax Amount (GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0077b6]/40 font-mono text-sm">
                    <tr>
                      <td className="py-3 px-3 border-r border-[#0077b6]/40 text-white font-sans text-xs">
                        Standard Rate ({taxRate}%)
                      </td>
                      <td className="py-3 px-3 border-r border-[#0077b6]/40 text-white">
                        {taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-white">
                        {taxAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-slate-950 font-bold">
                      <td className="py-3 px-3 border-r border-[#0077b6]/40 text-white font-sans text-xs">
                        Subtotal
                      </td>
                      <td className="py-3 px-3 border-r border-[#0077b6]/40 text-white">
                        INR {taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-white">
                        INR {taxAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Grand Total */}
            <div className="flex items-center justify-between gap-4">
              <div
                className="h-11 rounded-lg flex items-center px-6 flex-1 shadow-md bg-[#0077b6]"
                style={{
                  backgroundColor: "#0077b6",
                  backgroundImage: "linear-gradient(90deg, #0077b6 0%, #0096c7 40%, #00b4d8 70%, #03045e 100%)",
                }}
              >
                <span className="text-base font-bold text-white font-sans">Grand Total:</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono px-4">
                INR {grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Section 3: Sale from Hipzone Automation */}
            <div>
              <CyanBanner title="Sale from Hipzone Automation" />
              <div className="px-3 py-2 space-y-3 text-sm font-sans">
                <div className="grid grid-cols-[100px_1fr] items-center">
                  <span className="font-bold text-white">Name :</span>
                  <span className="text-[#e2e8f0] font-medium">{salesName}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center">
                  <span className="font-bold text-white">Contact :</span>
                  <span className="text-[#00b4d8] font-medium">{salesContact}</span>
                </div>
              </div>
            </div>
          </div>

          <BrandedFooter />
        </div>
      </div>

      {/* ========================================================
          PAGE 6: TERMS & CONDITIONS
          ======================================================== */}
      <div className={pageClass}>
        {CyanDiamondPattern()}

        <div className="relative z-10 flex-1 flex flex-col justify-between p-10">
          <div className="space-y-6 pt-4">
            <div className="text-center pt-2 pb-2">
              <h1 className="text-4xl font-black tracking-widest font-sans">
                <span className="text-[#0077b6]">HIPZONE</span>
                <span className="text-white ml-3">AUTOMATION</span>
              </h1>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-3">Terms and Conditions</h2>
              <div className="text-xs leading-relaxed text-[#cbd5e1] whitespace-pre-line font-sans space-y-2">
                {termsAndConditions}
              </div>
            </div>
          </div>

          <BrandedFooter />
        </div>
      </div>

      {/* ========================================================
          PAGE 7: PAYMENT TERMS, PRICING & SUPPORT
          ======================================================== */}
      <div className={pageClass}>
        {CyanDiamondPattern()}

        <div className="relative z-10 flex-1 flex flex-col justify-between p-10">
          <div className="space-y-6 pt-4">
            <div className="text-center pt-2 pb-2">
              <h1 className="text-4xl font-black tracking-widest font-sans">
                <span className="text-[#0077b6]">HIPZONE</span>
                <span className="text-white ml-3">AUTOMATION</span>
              </h1>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">Payment Terms</h2>
              <div className="text-xs leading-relaxed text-[#cbd5e1] whitespace-pre-line font-sans space-y-1">
                {paymentTerms}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">Pricing Terms</h2>
              <div className="text-xs leading-relaxed text-[#cbd5e1] font-sans">
                {pricingTerms}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">Cancellation Policy</h2>
              <div className="text-xs leading-relaxed text-[#cbd5e1] font-sans">
                {cancellationPolicy}
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-base font-bold text-white mb-3">Technical Support</h2>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-white font-sans">
                  <svg className="w-5 h-5 text-[#0096c7] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
                  </svg>
                  <span className="font-semibold text-[#e2e8f0]">{supportPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white font-sans">
                  <svg className="w-5 h-5 text-[#0096c7] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span className="font-semibold text-[#e2e8f0]">{supportEmail}</span>
                </div>
              </div>
            </div>
          </div>

          <BrandedFooter />
        </div>
      </div>

      {/* ========================================================
          PAGE 8: DUBAI & INDIA OFFICES & QR CODE
          ======================================================== */}
      <div className={pageClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hipzone-assets/hd_page_8.jpg"
          alt="Offices and QR Code"
          className="w-full h-full object-cover block"
        />

        {/* Page 8 Website footer link */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="41.0"
          data-pdf-top="95.2"
          data-pdf-width="18.0"
          data-pdf-height="2.6"
          title="Visit www.hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-1 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "95.2%",
            left: "41.0%",
            width: "18.0%",
            height: "2.6%",
          }}
        />

        {/* Page 8 QR Code clickable link overlay */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="42.8"
          data-pdf-top="77.0"
          data-pdf-width="14.5"
          data-pdf-height="10.2"
          title="Scan or click to visit hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-2 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "77.0%",
            left: "42.8%",
            width: "14.5%",
            height: "10.2%",
          }}
        />
      </div>

      {/* ========================================================
          PAGE 9: THANK YOU PAGE
          ======================================================== */}
      <div className={pageClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hipzone-assets/hd_page_9.jpg"
          alt="Thank You"
          className="w-full h-full object-cover block"
        />

        {/* Clickable Social Media Links & Website Overlays */}
        {/* Instagram Icon */}
        <a
          href="https://www.instagram.com/hipzone_automation/"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://www.instagram.com/hipzone_automation/"
          data-pdf-left="41.2"
          data-pdf-top="57.0"
          data-pdf-width="4.8"
          data-pdf-height="3.8"
          title="Visit Hipzone Automation on Instagram"
          className="absolute z-20 cursor-pointer block rounded-lg hover:ring-2 hover:ring-pink-500/60 transition-all"
          style={{
            top: "57.0%",
            left: "41.2%",
            width: "4.8%",
            height: "3.8%",
          }}
        />

        {/* Facebook Icon */}
        <a
          href="https://www.facebook.com/Hipzone.Automation/"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://www.facebook.com/Hipzone.Automation/"
          data-pdf-left="47.2"
          data-pdf-top="57.0"
          data-pdf-width="4.8"
          data-pdf-height="3.8"
          title="Visit Hipzone Automation on Facebook"
          className="absolute z-20 cursor-pointer block rounded-lg hover:ring-2 hover:ring-blue-500/60 transition-all"
          style={{
            top: "57.0%",
            left: "47.2%",
            width: "4.8%",
            height: "3.8%",
          }}
        />

        {/* YouTube Icon */}
        <a
          href="https://www.youtube.com/@Hipzone_Automation"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://www.youtube.com/@Hipzone_Automation"
          data-pdf-left="53.4"
          data-pdf-top="56.8"
          data-pdf-width="5.0"
          data-pdf-height="4.0"
          title="Visit Hipzone Automation on YouTube"
          className="absolute z-20 cursor-pointer block rounded-lg hover:ring-2 hover:ring-red-500/60 transition-all"
          style={{
            top: "56.8%",
            left: "53.4%",
            width: "5.0%",
            height: "4.0%",
          }}
        />

        {/* Website (center text under 'For Any Queries') */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="38.0"
          data-pdf-top="54.2"
          data-pdf-width="24.0"
          data-pdf-height="2.5"
          title="Visit hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-1 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "54.2%",
            left: "38.0%",
            width: "24.0%",
            height: "2.5%",
          }}
        />

        {/* Website (bottom footer) */}
        <a
          href="https://hipzoneautomation.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdf-link="https://hipzoneautomation.com"
          data-pdf-left="41.0"
          data-pdf-top="95.2"
          data-pdf-width="18.0"
          data-pdf-height="2.6"
          title="Visit www.hipzoneautomation.com"
          className="absolute z-20 cursor-pointer block rounded hover:ring-1 hover:ring-cyan-400/50 transition-all"
          style={{
            top: "95.2%",
            left: "41.0%",
            width: "18.0%",
            height: "2.6%",
          }}
        />
      </div>
    </div>
  );
}
