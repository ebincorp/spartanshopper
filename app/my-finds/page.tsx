import SavedFinds from '@/components/SavedFinds'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({ title: 'My Finds', description: 'Your saved deals and coupons, together in one place.', path: '/my-finds', noIndex: true })
export default function MyFindsPage() { return <SavedFinds /> }
