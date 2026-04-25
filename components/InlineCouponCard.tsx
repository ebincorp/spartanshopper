import CopyButton from '@/components/CopyButton'

interface InlineCoupon {
  _id: string
  title: string
  store: string
  code?: string
  discount?: string
  description?: string
  affiliateUrl: string
  expiryDate?: string
  startDate?: string
  active?: boolean
  imageUrl?: string
}

interface Props {
  coupon: InlineCoupon
}

export default function InlineCouponCard({ coupon }: Props) {
  const expired = coupon.expiryDate ? new Date(coupon.expiryDate) < new Date() : false

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
          Exclusive Deal
        </p>
        <h3 className="font-bold text-lg text-gray-900 leading-snug">{coupon.title}</h3>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{coupon.store}</p>

        {coupon.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{coupon.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {coupon.code && !expired && (
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
            href={coupon.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`inline-block font-extrabold text-sm px-4 py-2.5 rounded-xl transition ${
              expired
                ? 'bg-gray-200 text-gray-400 pointer-events-none'
                : 'text-white hover:opacity-90 active:scale-95'
            }`}
            style={!expired ? { backgroundColor: '#E63946' } : {}}
          >
            {expired
              ? 'Expired'
              : coupon.discount
              ? `Get ${coupon.discount} →`
              : 'Shop Now →'}
          </a>
        </div>

        {coupon.expiryDate && !expired && (
          <p className="text-xs text-gray-400 mt-3">
            Expires{' '}
            {new Date(coupon.expiryDate).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
