
"use client";

import dynamic from "next/dynamic";

const MemoryRoom = dynamic(() => import("./MemoryRoom"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">Preparing your little universe...</div>
  ),
});

export default function MuseumSection() {
  return <MemoryRoom />;
}
