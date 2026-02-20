'use client';

import { Crown, Wallet } from 'lucide-react';

import Image from 'next/image';
import { useAppContext } from '@/contexts/app-context';

export default function ProfileCard() {
  const { user, posts, burnPost } = useAppContext();
  return (
    <div className="p-px bg-linear-to-br from-[#2B7FFF] via-[#FF6900] to-[#F6339A] mx-4 rounded-[10px]">
      <div className="bg-white dark:bg-slate-900 py-10 rounded-[9px] z-10">
        <div className="flex ml-4 gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={'/wallet/alex.png'}
              alt={user?.name ?? ''}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col font-inter">
            <p className="text-[15px] font-medium">Alex Chen</p>
            <p className="text-[13px] -mt-1 text-[#99A1AF]">@alexchen</p>
            <p className="flex items-center justify-center text-[12px] mt-2 gap-1 text-[#FFD6A7] bg-[#7E2A0C] py-0.5 px-2 rounded-full">
              <span>
                <Crown size={12} />
              </span>
              <span>Level 4 Champion</span>
            </p>
          </div>
        </div>

        <div className="mx-4">
          <div className="w-full px-4 bg-[#364153] h-0.5 mt-4" />
        </div>

        <div className="flex w-full items-center justify-between px-4 text-slate-400 mt-3">
          <p className="text-xs">Wallet Balance</p>
          <p className="text-white text-[13px] flex gap-1 py-0.5 px-2 rounded-full items-center justify-center bg-orange-500">
            <Wallet size={13} className="text-white" />
            $2500.75
          </p>
        </div>
      </div>
    </div>
  );
}
