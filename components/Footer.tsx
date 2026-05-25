import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const links = [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
    { label: 'Terms of Service', href: '/terms-of-service' },
  ]

  return (
    <footer style={{ backgroundColor: '#1A1A2E' }} className="mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Logo + tagline */}
        <div className="text-center mb-6">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Spartan</span>
            <span style={{ color: '#E63946' }}>Shopper</span>
          </span>
          <p className="text-white/50 text-sm mt-1">Save Big. Enter to Win. Shop Smart.</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/60 hover:text-white text-sm transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 space-y-2 text-center">
          {/* Affiliate Disclaimer */}
          <p className="text-white/40 text-xs max-w-xl mx-auto">
            SpartanShopper.com is an affiliate site. We may earn a commission when you click links on our site. This does not affect the price you pay.
          </p>
          {/* Copyright */}
          <p className="text-white/30 text-xs">
            &copy; {currentYear} SpartanShopper.com — All Rights Reserved
          </p>
        </div>

      </div>
    </footer>
  )
}
