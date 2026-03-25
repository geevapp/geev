"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  History,
  Plus,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletTransaction } from "@/lib/types";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { useEffect, useState } from "react";

const INCOMING_TYPES = new Set(["fund", "prize_in"]);

const TX_LABEL: Record<WalletTransaction["type"], string> = {
  fund: "Deposit",
  prize_in: "Prize Received",
  withdraw: "Withdrawal",
  contribution_out: "Contribution",
};

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function WalletManagement() {
  const { user, setCurrentUser } = useAppContext();
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMethod, setFundMethod] = useState("card");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/wallet/transactions?limit=20");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTransactions(
          (data.data?.transactions ?? []).map((tx: WalletTransaction) => ({
            ...tx,
            createdAt: new Date(tx.createdAt),
            updatedAt: new Date(tx.updatedAt),
          }))
        );
      } catch {
        // silently fail — transactions will just be empty
      } finally {
        setIsLoadingTx(false);
      }
    };

    fetchTransactions();
  }, []);

  const { start, end } = getMonthBounds();
  const thisMonthTx = transactions.filter(
    (tx) =>
      tx.status !== "failed" &&
      new Date(tx.createdAt) >= start &&
      new Date(tx.createdAt) <= end
  );
  const receivedThisMonth = thisMonthTx
    .filter((tx) => INCOMING_TYPES.has(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const sentThisMonth = thisMonthTx
    .filter((tx) => !INCOMING_TYPES.has(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (!fundAmount || amount <= 0) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: fundMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to add funds", {
          description: data.error ?? "Please try again.",
        });
        return;
      }

      const newTx: WalletTransaction = {
        ...data.data.transaction,
        createdAt: new Date(data.data.transaction.createdAt),
        updatedAt: new Date(data.data.transaction.updatedAt),
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (user) {
        setCurrentUser({ ...user, walletBalance: data.data.balance });
      }

      toast("Wallet funded successfully!", {
        description: `$${amount.toFixed(2)} has been added to your wallet.`,
      });

      setFundAmount("");
      setShowFundModal(false);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || amount <= 0) return;
    if (amount > (user?.walletBalance ?? 0)) {
      toast.error("Insufficient funds", {
        description: "You don't have enough balance for this withdrawal.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "bank" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Withdrawal failed", {
          description: data.error ?? "Please try again.",
        });
        return;
      }

      const newTx: WalletTransaction = {
        ...data.data.transaction,
        createdAt: new Date(data.data.transaction.createdAt),
        updatedAt: new Date(data.data.transaction.updatedAt),
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (user) {
        setCurrentUser({ ...user, walletBalance: data.data.balance });
      }

      toast("Withdrawal initiated", {
        description: `$${amount.toFixed(2)} withdrawal is being processed.`,
      });

      setWithdrawAmount("");
      setShowWithdrawModal(false);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-6 space-y-4 border border-orange-100 dark:border-orange-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Wallet Balance
            </span>
          </div>
        </div>

        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ${(user?.walletBalance ?? 0).toFixed(2)}
        </div>

        <div className="flex gap-3">
          <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 bg-transparent"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-4 text-center">
            <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="font-semibold">Received</div>
            <div className="text-2xl font-bold text-green-600">
              ${receivedThisMonth.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">This month</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-4 text-center">
            <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="font-semibold">Sent</div>
            <div className="text-2xl font-bold text-blue-600">
              ${sentThisMonth.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">This month</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="font-semibold">Available</div>
            <div className="text-2xl font-bold text-orange-600">
              ${(user?.walletBalance ?? 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Ready to use</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTx ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No transactions yet. Add funds to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isIncoming = INCOMING_TYPES.has(transaction.type);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isIncoming
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {isIncoming ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {TX_LABEL[transaction.type]}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.method ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          isIncoming ? "text-green-600" : "text-blue-600"
                        }`}
                      >
                        {isIncoming ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Choose your funding method and amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Funding Method</Label>
              <Select value={fundMethod} onValueChange={setFundMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency Wallet</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fundMethod === "card" && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Card Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFundModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFundWallet}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? "Processing..." : `Add $${fundAmount || "0"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Transfer money from your wallet to your bank account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Amount (USD)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={user?.walletBalance ?? 0}
              />
              <div className="text-sm text-gray-500">
                Available balance: ${(user?.walletBalance ?? 0).toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Withdrawals typically take 1-3 business
                days to process. A small processing fee may apply.
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing
                  ? "Processing..."
                  : `Withdraw $${withdrawAmount || "0"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
