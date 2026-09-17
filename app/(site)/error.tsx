"use client";

import { useEffect } from "react";
import { House, RotateCw, TriangleAlert } from "lucide-react";
import { StatusScreen } from "@/components/feedback/StatusScreen";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Never render error.message: it can contain internal details.
  return (
    <StatusScreen
      icon={<TriangleAlert size={26} aria-hidden />}
      title="Something went wrong."
      description="This part of FoundingVFX didn't load. It's not you — please try again."
      actions={
        <>
          <Button onClick={reset} icon={<RotateCw size={18} aria-hidden />}>
            Try Again
          </Button>
          <Button href="/" variant="secondary" icon={<House size={18} aria-hidden />}>
            Return Home
          </Button>
        </>
      }
    >
      {error.digest && <p style={{ marginTop: 18, fontSize: 12, color: "var(--text-subtle)" }}>Reference: {error.digest}</p>}
    </StatusScreen>
  );
}
