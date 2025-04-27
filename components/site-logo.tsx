import Link from "next/link"
import { Heart } from "lucide-react"

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="bg-red-600 p-1 rounded-md">
        <Heart className="h-6 w-6 text-white" />
      </div>
      <span className="font-bold text-xl">Anytime CPR Health Services</span>
    </Link>
  )
}

