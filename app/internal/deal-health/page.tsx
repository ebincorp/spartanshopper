import DealHealthDashboard from '@/components/DealHealthDashboard'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({ title: 'Deal Health', description: 'Internal offer review queue.', path: '/internal/deal-health', noIndex: true })
export default function DealHealthPage() { return <DealHealthDashboard /> }
