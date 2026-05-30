"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InterestBadge } from "./InterestBadge";
import { NotifyMeModal } from "./NotifyMeModal";

export function NotifyCTA({
  productId,
  productName,
  initialCount,
}: {
  productId: string;
  productName: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" />
        Notify Me When Available
      </Button>
      <div className="mt-3 min-h-[1.25rem]">
        <InterestBadge count={count} />
      </div>
      <NotifyMeModal
        open={open}
        onClose={() => setOpen(false)}
        productId={productId}
        productName={productName}
        onSuccess={(newCount) => setCount(newCount)}
      />
    </div>
  );
}
