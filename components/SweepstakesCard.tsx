import Image from 'next/image'

interface SweepstakesCardProps {
  title: string
  sponsor: string
  prize: string
  entryUrl: string
  entryDeadline: string
  entryFrequency?: string
  image?: string
}

function getDeadlineInfo(deadline: string): { label: string; urgent: boolean; expired: boolean } {
  const now = new Date()
  const end = new Date(deadline)
  if (end < now) return { label: 'Ended', urgent: false, expired: true }
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) return { label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, urgent: true, expired: false }
  return { label: `Ends ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, urgent: false, expired: false }
}

export default function SweepstakesCard({
  title,
  sponsor,
  prize,
  entryUrl,
  entryDeadline,
  entryFrequency,
  image,
}: SweepstakesCardProps) {
  const deadline = getDeadlineInfo(entryDeadline)

  return (
    <div
      className="rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      {/* Image or accent bar */}
      {image ? (
        <div className="relative w-full h-44 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div style={{ backgroundColor: '#E63946' }} className="h-1.5 w-full" />
      )}

      {/* Header row */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div
          style={{ backgroundColor: '#E63946' }}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <span className="text-2xl">🏆</span>
        </div>
        <div className="text-right">
          {deadline.expired ? (
            <span className="bg-gray-600 text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
              Ended
            </span>
          ) : (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                deadline.urgent
                  ? 'bg-[#E63946] text-white'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {deadline.label}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 flex flex-col flex-1">
        <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">{sponsor}</p>
        <h3 className="text-white font-bold text-base leading-snug mb-2">{title}</h3>

        {/* Prize */}
        <div className="bg-white/5 rounded-xl px-4 py-3 mb-4">
          <p className="text-white/50 text-xs mb-0.5">Prize</p>
          <p style={{ color: '#E63946' }} className="font-extrabold text-lg leading-tight">
            {prize}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-xs text-white/50">
          <span>🆓 Free to enter</span>
          {entryFrequency && <span>🔄 {entryFrequency}</span>}
        </div>

        {/* CTA */}
        <a
          href={entryUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`block w-full text-center font-extrabold py-3 rounded-xl text-sm tracking-wide transition mt-auto ${
            deadline.expired
              ? 'bg-gray-600 text-gray-400 pointer-events-none'
              : 'text-white hover:opacity-90 active:scale-95'
          }`}
          style={!deadline.expired ? { backgroundColor: '#E63946' } : {}}
        >
          {deadline.expired ? 'Sweepstakes Ended' : 'Enter Now — FREE →'}
        </a>
      </div>
    </div>
  )
}
