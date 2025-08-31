import type React from "react"
import Link from "next/link"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={`flex items-center space-x-4 lg:space-x-6 ${className}`} {...props}>
      <Link href="/" className="text-base font-bold transition-colors hover:text-red-600">
        Home
      </Link>
      <Link href="/services" className="text-base font-bold transition-colors hover:text-red-600">
        Services
      </Link>
      <Link href="/about" className="text-base font-bold transition-colors hover:text-red-600">
        About
      </Link>
    </nav>
  )
}

