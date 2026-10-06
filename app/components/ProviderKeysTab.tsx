"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "convex/react";
import { Check, KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiResponse = { error?: string; connected?: boolean; saved?: boolean };

async function readError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiResponse | null;
  return body?.error || fallback;
}

export function ProviderKeysTab() {
  const keyStatus = useQuery(api.userCustomization.getZaiApiKeyStatus);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState<"test" | "save" | "remove" | null>(null);
  const [tested, setTested] = useState(false);

  const testConnection = async () => {
    if (!apiKey.trim() || busy) return;
    setBusy("test");
    setTested(false);
    try {
      const response = await fetch("/api/settings/zai-key/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) {
        throw new Error(
          await readError(response, "Z.AI connection test failed"),
        );
      }
      setTested(true);
      toast.success("Z.AI connection verified");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Z.AI connection test failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const saveKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey.trim() || busy) return;
    setBusy("save");
    try {
      const response = await fetch("/api/settings/zai-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to save API key"));
      }
      setApiKey("");
      setTested(false);
      toast.success("Z.AI API key saved for this account");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save API key",
      );
    } finally {
      setBusy(null);
    }
  };

  const removeKey = async () => {
    if (busy) return;
    setBusy("remove");
    try {
      const response = await fetch("/api/settings/zai-key", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Unable to remove API key"));
      }
      setTested(false);
      toast.success("Z.AI API key removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove API key",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-5">
      <section className="rounded-xl border bg-card p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <KeyRound
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium">Top Tools AI key for Z.AI</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Connect your own Top Tools AI key for GLM 5.2, GLM 5.3, and GLM
                5.3 Flash. The provider bills usage to your account.
              </p>
            </div>
          </div>
          {keyStatus === undefined ? (
            <Badge variant="secondary">Checking</Badge>
          ) : keyStatus?.configured ? (
            <Badge variant="secondary">Connected</Badge>
          ) : (
            <Badge variant="outline">Not connected</Badge>
          )}
        </div>

        {keyStatus?.configured && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-sm text-muted-foreground">
              Saved key ending in{" "}
              <span className="font-mono text-foreground">
                {keyStatus.keyLastFour}
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeKey}
              disabled={busy !== null}
            >
              {busy === "remove" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              Remove key
            </Button>
          </div>
        )}

        <form onSubmit={saveKey} className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="zai-api-key">
              {keyStatus?.configured ? "Replace API key" : "API key"}
            </Label>
            <Input
              id="zai-api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setTested(false);
              }}
              placeholder="Paste your Top Tools AI API key"
              aria-describedby="zai-key-privacy"
            />
            <p id="zai-key-privacy" className="text-xs text-muted-foreground">
              The key is encrypted before storage and is never shown again.
              Without a saved key, GLM requests use HackerAI&apos;s current
              provider.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={!apiKey.trim() || busy !== null}
            >
              {busy === "test" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : tested ? (
                <Check data-icon="inline-start" />
              ) : null}
              Test connection
            </Button>
            <Button type="submit" disabled={!apiKey.trim() || busy !== null}>
              {busy === "save" && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              Save key
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
