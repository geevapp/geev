import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Wallet } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export default function UserNavbar() {
  const { user } = useAppContext();
  return (
    <nav className="flex justify-between px-8 py-3.5 border-b border-slate-200 dark:border-slate-800">
      <Link href="/feed" className="flex items-center gap-3">
        <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
        <img
          src="/logo-dark.png"
          alt="Geev"
          className="h-8 hidden dark:block"
        />
      </Link>

      <div className="flex items-center gap-3">
        <p className="text-white text-[13px] flex gap-1 py-0.5 px-2 rounded-full items-center justify-center bg-orange-500">
          <Wallet size={13} className="text-white" />
          $2500.75
        </p>

        <ThemeToggle />

        <div className="w-9 h-9 rounded-full overflow-hidden">
          <Image
            src={'/wallet/alex.png'}
            alt={user?.name ?? ''}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </nav>
  );
}
