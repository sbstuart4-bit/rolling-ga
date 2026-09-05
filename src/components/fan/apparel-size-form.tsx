"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPAREL_SIZES, type ApparelSize } from "@/lib/types";
import { updateApparelSizeAction, type PreferenceActionState } from "@/server/fans/actions";

export function ApparelSizeForm({ initialSize }: { initialSize: ApparelSize | null }) {
  const [state, action, pending] = useActionState<PreferenceActionState, FormData>(
    updateApparelSizeAction,
    {},
  );
  const [size, setSize] = React.useState<ApparelSize | "">(initialSize ?? "");

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="apparelSize">Preferred apparel size</Label>
        <Select
          name="apparelSize"
          value={size}
          onValueChange={(value) => setSize(value as ApparelSize)}
          required
        >
          <SelectTrigger id="apparelSize" className="h-11">
            <SelectValue placeholder="Choose your size" />
          </SelectTrigger>
          <SelectContent>
            {APPAREL_SIZES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="apparelSize" value={size} />
        <p className="text-sm text-muted-foreground">
          We&apos;ll preselect this size on apparel when it&apos;s available. You can always choose
          another size for a single purchase.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Preferred size saved
        </p>
      )}

      <Button type="submit" disabled={pending || !size} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save preferred size"}
      </Button>
    </form>
  );
}
