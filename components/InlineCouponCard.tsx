import CopyButton from '@/components/CopyButton'
import { isCouponEnded } from '@/lib/offer-status'
import { offerExpiryLabel } from '@/lib/offerExpiry'

interface InlineCoupon {
  _id: string
  title: string
  store: string
  code?: string
  discount?: string
  description?: string
  affiliateUrl: string
  affiliateSlug?: string
  expiryDate?: string
  startDate?: string
  active?: boolean
  imageUrl?: string
}

interface Props {
  coupon: InlineCoupon
}

export default function InlineCouponCard({ coupon }: Props) {
  if (isCouponEnded(coupon) || (coupon.startDate && Date.parse(coupon.startDate) > Date.now())) return null
  const expiryLabel = offerExpiryLabel(coupon.expiryDate)

  return (
    <div className="my-6 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start border-2 border-dashed"
      style={{ borderColor: '#E63946', backgroundColor: '#fff5f5' }}
    >
      {coupon.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coupon.imageUrl}
          alt={coupon.store}
          className="w-16 h-16 object-contain rounded flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#E63946' }}>
          Coupon Offer
        </p>
        <h3 className="font-bold text-lg text-gray-900 leading-snug">{coupon.title}</h3>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{coupon.store}</p>

        {coupon.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{coupon.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {coupon.code && (
            <div className="flex items-center gap-2">
              <div
                className="border-2 border-dashed rounded-lg px-3 py-1.5 font-mono font-bold text-sm tracking-widest"
                style={{ borderColor: '#E63946', color: '#E63946' }}
              >
                {coupon.code}
              </div>
              <CopyButton code={coupon.code} />
            </div>
          )}

          <a
            href={coupon.affiliateSlug ? `/go/${coupon.affiliateSlug}` : coupon.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-block font-extrabold text-sm px-4 py-2.5 rounded-xl transition text-white hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#E63946' }}
          >
            {coupon.discount
              ? `Get ${coupon.discount} →`
              : 'Shop Now →'}
          </a>
        </div>

        {expiryLabel && (
          <p className="text-xs text-gray-500 mt-3">
            Expires{' '}
            {expiryLabel}
          </p>
        )}
      </div>
    </div>
  )
}
