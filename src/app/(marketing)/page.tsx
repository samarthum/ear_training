export default function Marketing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Train your ear, faster</h1>
        <p className="text-lg text-muted-foreground">
          Intervals, chord qualities, and progressions—always in tonal context.
        </p>
        <a
          href="/sign-in"
          className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-lg font-semibold hover:opacity-90"
        >
          Start practicing
        </a>
      </div>
    </div>
  );
}


