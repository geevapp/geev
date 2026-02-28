"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, DollarSign, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  title: string;
  description: string;
  onSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  title,
  description,
  onSuccess,
}: PaymentModalProps) {
  const { user } = useAppContext();
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const canPayWithWallet = (user?.walletBalance || 0) >= amount;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (paymentMethod === "wallet" && !canPayWithWallet) {
        throw new Error("Insufficient wallet balance");
      }

      toast("Payment successful!", {
        description: `$${amount.toFixed(2)} has been processed successfully.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Payment failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Display */}
          <Card className="border-0 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Amount
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {/* Wallet Payment */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="wallet"
                  id="wallet"
                  disabled={!canPayWithWallet}
                />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                  <Card
                    className={`border-2 transition-colors ${
                      paymentMethod === "wallet"
                        ? "border-blue-500"
                        : "border-gray-200"
                    } ${!canPayWithWallet ? "opacity-50" : ""}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="font-medium">Wallet Balance</div>
                            <div className="text-sm text-gray-500">
                              Available: $
                              {user?.walletBalance?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                        </div>
                        {!canPayWithWallet && (
                          <div className="text-xs text-red-500">
                            Insufficient funds
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>

              {/* Credit Card Payment */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <Card
                    className={`border-2 transition-colors ${
                      paymentMethod === "card"
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-gray-500">
                            Pay with your card
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Card Details Form */}
          {paymentMethod === "card" && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, number: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          expiry: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                (paymentMethod === "wallet" && !canPayWithWallet)
              }
              className="flex-1"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
