import type React from "react"
import Link from "next/link"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={`flex items-center space-x-4 lg:space-x-6 ${className}`} {...props}>
      <Link href="/" className="text-sm font-medium transition-colors hover:text-red-600">
        Home
      </Link>
      <Link href="/services" className="text-sm font-medium transition-colors hover:text-red-600">
        Services
      </Link>
      <Link href="/about" className="text-sm font-medium transition-colors hover:text-red-600">
        About
      </Link>
      <Link href="/schedule" className="text-sm font-medium transition-colors hover:text-red-600">
        Schedule
      </Link>
      <Link href="/contact" className="text-sm font-medium transition-colors hover:text-red-600">
        Contact
      </Link>
    </nav>
  )
}

