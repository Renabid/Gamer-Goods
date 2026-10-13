import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0d0f17] text-gray-100">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
      <p className="text-sm text-gray-400 font-medium">Loading gaming catalog...</p>
    </div>
  )
}
