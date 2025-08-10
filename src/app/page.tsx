export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Ear Training App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Improve your musical ear with interactive exercises for intervals, chords, and progressions.
            All exercises provide tonal context to help you develop relative pitch skills.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎵 Intervals
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Practice identifying intervals with melodic and harmonic exercises
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Start Practice
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎹 Chords
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Recognize chord qualities and inversions in tonal context
              </p>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Start Practice
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎼 Progressions
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Identify common chord progressions in major keys
              </p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}