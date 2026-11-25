"use client";

import { useEffect, useState } from "react";
import TelanganaReporterMap from "@/components/reporter-map/TelanganaReporterMap";
import type { Reporter } from "@/components/reporter-map/types";

export default function ReportersMapPage() {
  const [reporters, setReporters] = useState<Reporter[]>([]);

  useEffect(() => {
    fetch("/api/reporters").then((r) => r.json()).then(setReporters);
  }, []);

  return (
    <main style={{ padding: 24, background: "#eef1f5", minHeight: "100vh" }}>
      <TelanganaReporterMap reporters={reporters} />
    </main>
  );
}
