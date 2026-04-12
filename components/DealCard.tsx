import Image from 'next/image'

interface DealCardProps {
  title: string
  store: string
  salePrice: number
  originalPrice?: number
  affiliateUrl: string
  slug: string
  image?: string
  expiryDate?: string
}

function getExpiryStatus(expiryDate?: string): 'expired' | 'soon' | 'ok' | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  if (expiry < now) return 'expired'
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursLeft <= 48) return 'soon'
  return 'ok'
}

export default function DealCard({
  title,
  store,
  salePrice,
  originalPrice,
  affiliateUrl,
  slug,
  image,
  expiryDate,
}: DealCardProps) {
  const expiryStatus = getExpiryStatus(expiryDate)
  const savings =
    originalPrice && originalPrice > salePrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : null

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200 group">

      {/* Image */}
      <div className="relative w-full h-44 bg-white overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Savings badge — only show for realistic discounts (≤75%) */}
        {savings && savings <= 75 && (
          <div
            style={{ backgroundColor: '#E63946' }}
            className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            {savings}% OFF
          </div>
        )}
        {/* Expired badge */}
        {expiryStatus === 'expired' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-extrabold text-xl tracking-widest">EXPIRED</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{store}</p>
        <h3 className="text-gray-900 font-bold text-sm leading-snug mb-3 flex-1">{title}</h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-3">
          <span style={{ color: '#E63946' }} className="text-2xl font-extrabold">
            ${salePrice.toFixed(2)}
          </span>
          {originalPrice && originalPrice > salePrice && (
            <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Expiry */}
        {expiryDate && expiryStatus !== 'expired' && (
          <p className={`text-xs mb-3 font-medium ${expiryStatus === 'soon' ? 'text-[#E63946]' : 'text-gray-400'}`}>
            {expiryStatus === 'soon' ? '⚠ Expires soon: ' : 'Expires: '}
            {new Date(expiryDate).toLocaleDateString()}
          </p>
        )}

        {/* CTA */}
        <a
          href={`/go/${slug}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`block w-full text-center text-white font-bold py-2.5 rounded-xl text-sm transition-opacity ${
            expiryStatus === 'expired'
              ? 'bg-gray-300 pointer-events-none opacity-60'
              : 'hover:opacity-90 active:scale-95'
          }`}
          style={expiryStatus !== 'expired' ? { backgroundColor: '#E63946' } : {}}
        >
          {expiryStatus === 'expired' ? 'Deal Expired' : 'Get Deal →'}
        </a>
      </div>
    </div>
  )
}
