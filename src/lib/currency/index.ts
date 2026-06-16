// Currency formatting utility
// Uses Intl.NumberFormat for locale-aware formatting.
// Currency code comes from restaurants.currency (e.g. 'AED', 'INR').

export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  const resolvedLocale = locale ?? localeForCurrency(currency)
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function localeForCurrency(currency: string): string {
  const map: Record<string, string> = {
    AED: "en-AE",
    INR: "en-IN",
    USD: "en-US",
    EUR: "en-GB",
    GBP: "en-GB",
    SAR: "ar-SA",
    QAR: "ar-QA",
    KWD: "ar-KW",
    BHD: "ar-BH",
    OMR: "ar-OM",
  }
  return map[currency] ?? "en-US"
}
