import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentFail = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Оплата не прошла | Virtual Companion</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Оплата не прошла</CardTitle>
            <CardDescription>
              Платёж был отменён или произошла ошибка. Попробуйте ещё раз.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/deposit")} className="w-full">
              Попробовать снова
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
              Вернуться в личный кабинет
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentFail;