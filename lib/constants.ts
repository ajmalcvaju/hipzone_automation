import { CompanySettings } from "@/types";

export const DEFAULT_BANK_DETAILS = {
  companyName: "WiZN Systems Pvt. Ltd.",
  registeredAddress:
    "#102, Regent Prime, 2nd Floor Whitefield Main Road, Sathya Sai Layout Bengaluru, Karnataka",
  pin: "560066",
  gstin: "29AABCW4252C1ZH",
  bankName: "ICICI Bank",
  accountName: "WiZN Systems Pvt. Ltd.",
  accountNumber: "194805000026",
  ifscCode: "ICIC0001948",
  customerCare: "080-68494214",
  tollFree: "1800-202-6995",
  upiId: "wiznsystemsprivatelimited@icici",
};

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "Hipzone Automation",
  tagline: "Home Design | Security | Innovation",
  website: "www.hipzoneautomation.com",
  email: "name@hipzoneautomation",
  phone: "+91 7012566008",
  quotationPrefix: "HZA-",
  defaultValidityDays: 30,
  defaultTaxRate: 18,
  defaultCurrency: "INR",
  defaultTheme: "hipzone-cyan",
  bankDetails: DEFAULT_BANK_DETAILS,
  dubaiOffice: {
    address: "Hipzone Automation, Aswaaq Mall – Al Mizhar Dubai, United Arab Emirates",
    phone1: "+971566767556",
    phone2: "+971556775848",
  },
  indiaOffice: {
    corporateAddress: "Hipzone Automation, Hilite Business Park, Calicut - Kerala",
    operatingAddress: "Hipzone Automation, Purakkattiri, Calicut | Kalpatta Wayanad, Kerala - 673121",
    phone1: "+91 9496686458",
    phone2: "+91 8136934920",
  },
  defaultSalesContact: {
    name: "Sales Team",
    contact: "name@hipzoneautomation",
    email: "name@hipzoneautomation",
  },
  defaultTechnicalSupport: {
    phone: "+91 7012566008",
    email: "support@hipzoneautomation.com",
    tollFree: "+91 7012566008",
  },
  defaultProjectDescription:
    "HIPZONE AUTOMATION transforms homes and businesses into smarter, safer, and more intelligent spaces. With over 8 years of expertise in India and an expanding presence in Dubai, we deliver AI-integrated automation and security solutions powered by trusted global brands.\n\nOur intelligent systems go beyond standard automation. They learn your lifestyle, anticipate your needs, and optimize comfort, security, and energy efficiency automatically. We combine technical expertise with personalized service to ensure every project is reliable, future-ready, and supported by strong customer care.",
  defaultTerms:
    "Thank you for your interest in Hipzone Automation India. We are committed to delivering innovative and reliable home automation solutions. Please review the following terms and conditions\n\nPrices: All prices are quoted in INR (Indian Rupees) and are inclusive of applicable taxes, unless otherwise specified\n\nValidity: This proposal remains valid for 30 days from the date of issue.\n\nInstallation: The proposal does not include costs for additional wiring, alterations, or modifications required at the time of installation.\n\nMobile Application: The Hipzone mobile app is free of charge and can be installed on multiple devices.",
  defaultPaymentTerms:
    "1. 25% – Upon order confirmation.\n2. 50% – Upon marking automation points and providing wiring drawings at the site.\n3. 75% – Upon completion of range mapping and site testing (including verification of electrical components, switch-boxes, lights, and automation provisions).\n4. 100% – Prior to dispatch of materials.",
  defaultCancellationPolicy:
    "Any advance paid will be refunded if cancellation is made within 3 days of payment. After this period, the advance is non-refundable.",
  defaultWarrantyTerms:
    "The products mentioned in this proposal come with a limited two year warranty. The customer has the option to extend the warranty of the products towards the end of the current warranty period.",
  defaultRecommendations:
    "We highly recommend using stable power supply and good quality networking equipment for seamless automation and surveillance performance.",
  defaultDeliveryTerms:
    "Within 15 days from receipt of the Purchase Order and advance payment.",
};

// Initial products seed (empty by default so no dummy products populate catalog)
export const INITIAL_PRODUCTS_SEED: Array<{
  name: string;
  price: number;
  description: string;
  category: string;
}> = [];
