export default function AppLoading() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="flex items-center gap-3 text-[color:var(--brand-text)]">
        <svg className="animate-spin size-5" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>Loading…</span>
      </div>
    </div>
  )
}


