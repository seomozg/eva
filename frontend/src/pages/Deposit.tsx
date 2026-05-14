import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Wallet } from "lucide-react";
import api from "@/lib/api";

const PRESET_AMOUNTS = [100, 500, 1000, 3000];

const Deposit = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAmount = customAmount ? Number(customAmount) : amount;

  const handleDeposit = async () => {
    const value = selectedAmount;
    if (!value || value <= 0) {
      setError("Введите сумму пополнения");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/payments/create", { amount: value });
      const { confirmationUrl } = response.data;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      } else {
        setError("Не удалось получить ссылку для оплаты");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при создании платежа. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Пополнение баланса | Virtual Companion</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-muted rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-display font-medium">Пополнение баланса</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-primary" />
                Выберите сумму пополнения
              </CardTitle>
              <CardDescription>
                1 рубль = 1 кредит. После оплаты баланс обновится автоматически.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setAmount(preset); setCustomAmount(""); }}
                    className={`p-3 rounded-lg border text-center font-medium transition-colors ${
                      selectedAmount === preset && !customAmount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {preset} ₽
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Своя сумма</label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Введите сумму в рублях"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₽
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Deposit button */}
              <Button
                onClick={handleDeposit}
                disabled={loading || selectedAmount <= 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Создаю платёж...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Пополнить на {selectedAmount} ₽
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Вы будете перенаправлены на страницу оплаты криптовалютой (CryptoCloud)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Deposit;