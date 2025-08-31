import Link from "next/link"
import Image from "next/image"

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative w-48 h-16">
        <Image
          src="/logo.PNG"
          alt="Anytime CPR Health Services Logo"
          fill
          className="object-contain"
        />
      </div>
      <span className="-ml-2 text-xl font-bold text-gray-900 hidden md:block">
        Anytime CPR Health Services
      </span>
    </Link>
  )
}

