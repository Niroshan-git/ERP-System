"use client";

import { useState } from "react";

export type DocTab = { id: string; label: string; content: React.ReactNode };

/** Tab content is server-rendered ahead of time and passed in as `content` — this component only switches visibility. */
export function DocTabs({ tabs }: { tabs: DocTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="mb-4 flex gap-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`-mb-px border-b-2 px-1 py-2 text-sm font-medium ${
              activeId === tab.id
                ? "border-signal text-graphite-900"
                : "border-transparent text-graphite-500 hover:text-graphite-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={activeId !== tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
