import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function ProjectGrid({
  children,
  columns = "three",
}: {
  children: ReactNode;
  columns?: "two" | "three";
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        columns === "two" ? "lg:grid-cols-2" : "lg:grid-cols-2 2xl:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
