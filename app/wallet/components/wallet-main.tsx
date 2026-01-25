import { useAppContext } from "@/contexts/app-context";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  History,
  LucideIcon,
  Minus,
  Plus,
  Wallet,
} from "lucide-react";

export default function WalletMain() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <ArrowLeft size={16} />
          <p className="text-sm">Back to Settings</p>
        </div>

        <p className="text-[22px] font-bold">Wallet</p>
      </div>

      <BalanceCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Received"
          icon={ArrowDownLeft}
          amount={245}
          time="This month"
        />
        <StatCard
          title="Sent"
          icon={ArrowUpRight}
          amount={89.5}
          time="This month"
        />
        <StatCard
          title="Available"
          icon={DollarSign}
          amount={2500.75}
          time="Ready to use"
        />
      </div>

      <TransactionCard />
    </div>
  );
}

function BalanceCard() {
  // const { currentUser } = useAppContext();
  const balance = 100; // Mock balance
  const usdRate = 0.12; // Mock XLM to USD rate
  return (
    <div className="w-full bg-orange-50 dark:bg-[#44130633] p-4 sm:p-6 rounded-[14px] my-4 sm:my-6 border border-orange-200 dark:border-[#9F2D004D]">
      <div className="flex items-center gap-3">
        <Wallet size={20} className="text-orange-400" />
        <p className="font-semibold text-sm sm:text-base">Wallet Balance</p>
      </div>
      <p className="pt-2 font-bold text-2xl sm:text-[30px] text-gray-900 dark:text-[#F3F4F6]">
        {balance} XLM
      </p>
      <p className="text-muted-foreground text-sm pb-2 -mt-1">
        ≈ ${(balance * usdRate).toFixed(2)} USD
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button className="flex items-center justify-center bg-orange-500 rounded-md py-2 px-3 gap-3 cursor-pointer hover:bg-orange-600 transition text-white">
          <Plus size={14} />
          <p className="text-sm ">Add Funds</p>
        </button>
        <button className="flex items-center justify-center bg-white dark:bg-[#FFFFFF0B] border border-orange-500 dark:border-[#CA3500] text-orange-500 rounded-md py-2 px-3 gap-3 cursor-pointer hover:bg-orange-50 dark:hover:bg-[#FFFFFF1A] transition">
          <ArrowUpRight size={16} />
          <p className="text-sm">Withdraw</p>
        </button>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: "Received" | "Sent" | "Available";
  amount: number;
  icon: LucideIcon;
  time: string;
};

function StatCard({ title, amount, icon: Icon, time }: StatCardProps) {
  return (
    <div className="border border-gray-200 dark:border-[#1E2939] bg-white dark:bg-transparent py-10 px-6 rounded-[14px] flex flex-col items-center justify-center">
      <Icon
        size={32}
        className={`${title === "Received" ? "text-[#00C950]" : title === "Sent" ? "text-[#2B7FFF]" : title === "Available" ? "text-orange-500" : ""}`}
      />
      <p className="text-sm mt-2">{title}</p>
      <p
        className={`${title === "Received" ? "text-[#00C950]" : title === "Sent" ? "text-[#2B7FFF]" : title === "Available" ? "text-orange-500" : ""} font-bold text-[25px]`}
      >
        ${amount.toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  );
}

type MockT = {
  id: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  reason?: string;
  label?: "Completed" | "Pending" | "Failed";
  timestamp: string;
};

const mockTransactions: MockT[] = [
  {
    id: "1",
    type: "Deposit",
    amount: 50,
    currency: "XLM",
    reason: "Credit Card",
    from: "Alice Chen",
    label: "Completed",
    timestamp: "2026-01-20T10:30:00Z",
  },
  {
    id: "2",
    type: "Withdrawal",
    amount: 25,
    currency: "XLM",
    to: "Bob Smith",
    reason: "Bank Transfer",
    label: "Completed",
    timestamp: "2026-01-19T15:45:00Z",
  },
  {
    id: "3",
    type: "Deposit",
    amount: 10,
    currency: "XLM",
    reason: "Won giveaway",
    label: "Pending",
    timestamp: "2026-01-18T12:00:00Z",
  },
];

// const mockTransactions = [];

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function TransactionCard() {
  return (
    <div className="w-full border border-gray-200 dark:border-[#1E2939] bg-white dark:bg-transparent mt-4 sm:mt-6 rounded-[14px] p-4 sm:p-6">
      <div className="flex gap-3">
        <History size={20} />
        <p className="font-semibold ">Recent Transactions</p>
      </div>
      <p className="text-muted-foreground text-sm pt-1">
        Your latest wallet activity
      </p>

      <div>
        {mockTransactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-6">
            No recent transactions
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="w-full p-3 bg-gray-50 dark:bg-[#1E293980] rounded-[10px] border border-gray-200 dark:border-[#364153] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-[#DCFCE7]">
                    {tx.type === "Deposit" ? (
                      <ArrowDownLeft size={16} className="text-[#00C950]" />
                    ) : tx.type === "Withdrawal" ? (
                      <ArrowUpRight size={16} className="text-[#155DFC]" />
                    ) : null}
                  </div>

                  <div className="flex flex-col">
                    <p className="text-sm">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end items-start w-full sm:w-auto">
                  <p
                    className={`${tx.type === "Deposit" ? "text-[#00C950]" : "text-[#155DFC]"} text-[15px] flex items-center`}
                  >
                    {tx.type === "Deposit" ? (
                      <Plus size={13} />
                    ) : (
                      <Minus size={13} />
                    )}{" "}
                    ${tx.amount}
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`${tx.label === "Completed" ? "bg-green-100 dark:bg-[#E5E5E5] text-green-700 dark:text-black" : tx.label === "Pending" ? "bg-yellow-100 dark:bg-[#262626] text-yellow-700 dark:text-white" : ""} font-medium lowercase text-xs py-0.5 px-2 rounded-full`}
                    >
                      {tx.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
