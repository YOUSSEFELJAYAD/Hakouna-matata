"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield } from "lucide-react";

/**
 * TOTP Verification Component
 * For verifying 2FA during login
 */
export function VerifyTOTP({
  onSuccess,
  onUseBackupCode,
}: {
  onSuccess?: () => void;
  onUseBackupCode?: () => void;
}) {
  const [token, setToken] = useState<string>("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string>("");

  const verifyMutation = trpc.twoFactor.verifyToken.useMutation({
    onSuccess: () => {
      setError("");
      onSuccess?.();
    },
    onError: (error) => {
      setError(error.message);
      setToken("");
    },
  });

  const handleVerify = () => {
    if (token.length < 6) {
      setError("Please enter a valid code");
      return;
    }
    verifyMutation.mutate({ token, trustDevice });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && token.length >= 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="token">Verification Code</Label>
          <Input
            id="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="000000"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/[^0-9A-Z-]/gi, ""))}
            onKeyPress={handleKeyPress}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
          <p className="text-xs text-muted-foreground text-center">
            Enter 6-digit code or backup code
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="trust"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
          />
          <label
            htmlFor="trust"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Trust this device for 30 days
          </label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={handleVerify}
          disabled={verifyMutation.isPending || token.length < 6}
          className="w-full"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>

        {onUseBackupCode && (
          <Button
            variant="ghost"
            onClick={onUseBackupCode}
            className="w-full"
            disabled={verifyMutation.isPending}
          >
            Use backup code instead
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
