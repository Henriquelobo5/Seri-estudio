export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-4 border-[#EEE8DF]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2A5E40] animate-spin" />
      </div>
      <span className="ml-3 text-sm text-[#888]">Carregando...</span>
    </div>
  )
}
