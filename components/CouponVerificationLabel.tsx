import { getCouponVerification, type CouponVerification } from '@/lib/couponVerification'

export default function CouponVerificationLabel({ verification }: { verification?: CouponVerification | null }) {
  const check = getCouponVerification(verification)
  if (!check) return <p className="text-sm text-slate-600">No dated check on file.</p>

  return (
    <p className={`text-sm ${check.status === 'checkout-failed' ? 'text-rose-800' : 'text-slate-700'}`}>
      <strong>{check.label}</strong> on <time dateTime={check.checkedOn}>{check.dateLabel}</time>.
    </p>
  )
}
