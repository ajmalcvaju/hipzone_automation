"use client";

import React, { useEffect, useState } from "react";
import { getCompanySettings, saveCompanySettings } from "@/services/settings";
import { CompanySettings } from "@/types";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanySettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await saveCompanySettings(settings);
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-20 text-center text-slate-400 text-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099e5] mx-auto mb-3" />
        <p>Loading company configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System &amp; Company Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure company branding, global offices, and currency preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900">Company Identity &amp; Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Quotation Defaults */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Quotation Defaults &amp; Numbering</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                value={settings.quotationPrefix}
                onChange={(e) => setSettings({ ...settings, quotationPrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. HZA-2026-</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                value={settings.defaultValidityDays}
                onChange={(e) =>
                  setSettings({ ...settings, defaultValidityDays: parseInt(e.target.value, 10) || 30 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Standard Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={settings.defaultTaxRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Offices */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Global Office Addresses</h2>
          </div>

          {/* Dubai Office */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dubai Office
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.dubaiOffice.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dubaiOffice: { ...settings.dubaiOffice, address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phone 1
                </label>
                <input
                  type="text"
                  value={settings.dubaiOffice.phone1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dubaiOffice: { ...settings.dubaiOffice, phone1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phone 2
                </label>
                <input
                  type="text"
                  value={settings.dubaiOffice.phone2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dubaiOffice: { ...settings.dubaiOffice, phone2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* India Office */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              India Offices
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Corporate Office
                </label>
                <input
                  type="text"
                  value={settings.indiaOffice.corporateAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indiaOffice: {
                        ...settings.indiaOffice,
                        corporateAddress: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Operating Office
                </label>
                <input
                  type="text"
                  value={settings.indiaOffice.operatingAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indiaOffice: {
                        ...settings.indiaOffice,
                        operatingAddress: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  India Phone 1
                </label>
                <input
                  type="text"
                  value={settings.indiaOffice.phone1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indiaOffice: { ...settings.indiaOffice, phone1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  India Phone 2
                </label>
                <input
                  type="text"
                  value={settings.indiaOffice.phone2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indiaOffice: { ...settings.indiaOffice, phone2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Default Clauses */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Default Legal &amp; Policy Terms</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Terms &amp; Conditions
              </label>
              <textarea
                rows={4}
                value={settings.defaultTerms}
                onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Payment Milestones
              </label>
              <textarea
                rows={4}
                value={settings.defaultPaymentTerms}
                onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cancellation Policy
              </label>
              <textarea
                rows={2}
                value={settings.defaultCancellationPolicy}
                onChange={(e) =>
                  setSettings({ ...settings, defaultCancellationPolicy: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#0099e5] hover:bg-[#0088d1] text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
