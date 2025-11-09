"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check, Shield } from "lucide-react";

/**
 * TOTP Setup Component
 * Guides users through enabling TOTP-based 2FA
 */
export function SetupTOTP({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState<"init" | "verify">("init");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const setupMutation = trpc.twoFactor.setupTOTP.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("verify");
      setError("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifyMutation = trpc.twoFactor.verifyAndEnableTOTP.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (token.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    verifyMutation.mutate({ token });
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (backupCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            2FA Enabled Successfully
          </CardTitle>
          <CardDescription>
            Save your backup codes in a secure location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Store these backup codes in a safe place. Each code can only be used once. You'll need them if you lose access to your authenticator app.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="text-center py-2">
                {code}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleDownloadBackupCodes} variant="outline">
            Download Codes
          </Button>
          <Button onClick={onSuccess}>Done</Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Authenticator App</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
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
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => setStep("init")}
            variant="outline"
            disabled={verifyMutation.isPending}
          >
            Back
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifyMutation.isPending || token.length !== 6}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Enable 2FA"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with TOTP-based 2FA using an authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrCode ? (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold">Step 1: Install an Authenticator App</h3>
              <p className="text-sm text-muted-foreground">
                Download an authenticator app on your phone:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Google Authenticator (iOS, Android)</li>
                <li>Authy (iOS, Android)</li>
                <li>1Password (iOS, Android, Desktop)</li>
                <li>Microsoft Authenticator (iOS, Android)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Step 2: Generate QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Click the button below to generate your unique QR code.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">Step 2: Scan QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app:
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or enter this key manually:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        {!qrCode ? (
          <Button
            onClick={handleSetup}
            disabled={setupMutation.isPending}
            className="w-full"
          >
            {setupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate QR Code"
            )}
          </Button>
        ) : (
          <Button onClick={() => setStep("verify")} className="w-full">
            Next: Verify Code
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
