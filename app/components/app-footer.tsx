"use client"

export function AppFooter() {
  return (
    <footer className="border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo-light.png" alt="Geev" className="h-5 dark:hidden" />
            <img src="/logo-dark.png" alt="Geev" className="h-5 hidden dark:block" />
            {/* <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Geev</span> */}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Building stronger communities through social giving
          </p>
        </div>
      </div>
    </footer>
  )
}
