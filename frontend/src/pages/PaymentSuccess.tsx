import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  // Auto-redirect to dashboard after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => navigate("/dashboard"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Оплата успешна | Virtual Companion</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Оплата прошла успешно!</CardTitle>
            <CardDescription>
              Баланс будет зачислен в течение нескольких секунд.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Вы будете автоматически перенаправлены в личный кабинет через 5 секунд.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Вернуться в личный кабинет
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentSuccess;