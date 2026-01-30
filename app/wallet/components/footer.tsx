import Link from "next/link";

export default function WalletFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
      <Link href="/feed" className="flex items-center gap-3">
        <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
        <img
          src="/logo-dark.png"
          alt="Geev"
          className="h-8 hidden dark:block"
        />
      </Link>

      <p className="dark:text-white/50 text-black/50 text-xs sm:text-sm text-center sm:text-left">
        Building stronger communities through social giving
      </p>
    </footer>
  );
}
