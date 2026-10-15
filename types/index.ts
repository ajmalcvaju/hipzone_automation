export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  category?: string;
  itemCode?: string;
  hsn?: string;
  purchasePrice?: number;
  discountType?: string;
  saleDiscount?: number;
  stockQty?: number;
  minStock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TableType = "2-col" | "4-col" | "6-col" | "7-col";

export interface QuotationTableItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  hsn?: string;
  qty: number;
  price: number;
  taxPercent?: number;
  taxAmount?: number;
  total: number;
}

export interface QuotationTable {
  id: string;
  title: string;
  type: TableType;
  items: QuotationTableItem[];
}

export interface QuotationPage {
  id: string;
  pageNumber: number;
  title?: string;
  tables: QuotationTable[];
}

export interface AddressDetail {
  name: string;
  mobile: string;
  address: string;
}

export interface QuotationClient {
  name: string;
  phone: string;
  address: string;
  email?: string;
  company?: string;
  billingAddress?: AddressDetail;
  shippingAddress?: AddressDetail;
}

export interface SalesContact {
  name: string;
  contact: string;
  email?: string;
}

export interface TechnicalSupport {
  phone: string;
  email: string;
  tollFree?: string;
}

export interface BankDetails {
  companyName: string;
  registeredAddress: string;
  pin: string;
  gstin: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  customerCare: string;
  tollFree: string;
  upiId: string;
}

export type TemplateTheme = "figma-gold" | "hipzone-cyan";

export interface AdditionalChargeItem {
  description: string;
  price: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  proposalId?: string; // e.g. "MEBT"
  proposalTitle?: string; // e.g. "Smart Home Proposal"
  templateTheme?: TemplateTheme; // default 'figma-gold'
  quotationDate: string;
  validUntil: string;
  status: QuotationStatus;
  client: QuotationClient;
  projectDescription: string;
  taxRate: number; // e.g. 5
  currency: string; // e.g. 'INR'
  salesContact: SalesContact;
  technicalSupport: TechnicalSupport;
  termsAndConditions: string;
  paymentTerms: string;
  pricingTerms?: string;
  cancellationPolicy?: string;
  warrantyTerms?: string;
  recommendations?: string;
  deliveryTerms?: string;
  bankDetails?: BankDetails;
  installationCharges?: AdditionalChargeItem;
  shippingCharges?: AdditionalChargeItem;
  pages: QuotationPage[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  amountInWords?: string;
  discount?: number;
  additionalCharges?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface OfficeDetail {
  name: string;
  address: string;
  phone1: string;
  phone2?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl?: string;
  website: string;
  email: string;
  phone: string;
  quotationPrefix: string;
  defaultValidityDays: number;
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultTheme?: TemplateTheme;
  bankDetails?: BankDetails;
  dubaiOffice: {
    address: string;
    phone1: string;
    phone2: string;
  };
  indiaOffice: {
    corporateAddress: string;
    operatingAddress: string;
    phone1: string;
    phone2: string;
  };
  defaultSalesContact: SalesContact;
  defaultTechnicalSupport: TechnicalSupport;
  defaultProjectDescription: string;
  defaultTerms: string;
  defaultPaymentTerms: string;
  defaultCancellationPolicy: string;
  defaultWarrantyTerms?: string;
  defaultRecommendations?: string;
  defaultDeliveryTerms?: string;
}

export interface UserSession {
  username: string;
  displayName: string;
  role: "admin" | "sales";
  token?: string;
}
