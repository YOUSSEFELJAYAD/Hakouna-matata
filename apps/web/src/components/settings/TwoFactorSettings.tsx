"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Smartphone, Mail, Key, Loader2 } from "lucide-react";
import { SetupTOTP } from "@/components/auth/2fa/SetupTOTP";

/**
 * Two-Factor Authentication Settings Component
 * Manage 2FA settings and backup codes
 */
export function TwoFactorSettings() {
  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const utils = trpc.useUtils();

  const { data: status, isLoading } = trpc.twoFactor.getStatus.useQuery();

  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
    },
  });

  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      utils.twoFactor.getStatus.invalidate();
    },
  });

  const handleDisable = () => {
    if (confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) {
      // In production, require password confirmation
      disableMutation.mutate({ password: "dummy" });
    }
  };

  const handleRegenerateBackupCodes = () => {
    if (
      confirm(
        "This will invalidate your existing backup codes. Are you sure you want to continue?"
      )
    ) {
      regenerateMutation.mutate();
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Status</h3>
                {status?.enabled ? (
                  <Badge variant="default" className="bg-green-600">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              {status?.enabled && status.method && (
                <p className="text-sm text-muted-foreground">
                  Method: {status.method}
                </p>
              )}
            </div>
            {status?.enabled ? (
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            ) : (
              <Button onClick={() => setShowSetup(true)}>Enable 2FA</Button>
            )}
          </div>

          {/* 2FA Methods */}
          <div className="space-y-4">
            <h3 className="font-semibold">Available Methods</h3>

            {/* TOTP */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <h4 className="font-medium">Authenticator App (TOTP)</h4>
                <p className="text-sm text-muted-foreground">
                  Use Google Authenticator, Authy, or similar apps to generate verification codes
                </p>
                {status?.enabled && status.method === "TOTP" && (
                  <Badge variant="secondary" className="mt-2">
                    Active
                  </Badge>
                )}
              </div>
            </div>

            {/* SMS */}
            <div className="flex items-start gap-3 p-4 border rounded-lg opacity-50">
              <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <h4 className="font-medium">SMS (Coming Soon)</h4>
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via SMS
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-4 border rounded-lg opacity-50">
              <Key className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <h4 className="font-medium">Email (Coming Soon)</h4>
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via email
                </p>
              </div>
            </div>
          </div>

          {/* Backup Codes */}
          {status?.enabled && (
            <div className="space-y-4">
              <h3 className="font-semibold">Backup Codes</h3>
              <Alert>
                <AlertDescription>
                  You have {status.backupCodesAvailable} backup code(s) remaining. Backup codes can be used if you lose access to your authenticator app.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={handleRegenerateBackupCodes}
                disabled={regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Regenerate Backup Codes"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-2xl">
          <SetupTOTP
            onSuccess={() => {
              setShowSetup(false);
              utils.twoFactor.getStatus.invalidate();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your New Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center py-2">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadBackupCodes} variant="outline" className="flex-1">
                Download
              </Button>
              <Button onClick={() => setShowBackupCodes(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
