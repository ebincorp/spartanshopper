export interface AmazonPromotion {
  brand: string
  promoCode: string
  discountPercent: number
  category: string
  startDate: string
  endDate: string
  productUrl?: string
  description?: string
}

export interface CreatedDraft {
  sanityId: string
  title: string
  code: string
  discount: string
  category: string
  expiryDate: string
}

export interface ScanResult {
  found: AmazonPromotion[]
  added: CreatedDraft[]
  skipped: AmazonPromotion[]
  errors: string[]
}
