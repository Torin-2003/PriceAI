"use client";

import type { ReactNode } from "react";

export type AdminNavItem = {
  id: string;
  label: string;
  count?: number | null;
  icon: ReactNode;
  description?: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

type AdminShellProps = {
  sections: AdminNavSection[];
  activeItemId: string;
  onSelectItem: (itemId: string) => void;
  children: ReactNode;
};

export function AdminShell({ sections, activeItemId, onSelectItem, children }: AdminShellProps) {
  const activeSection = sections.find((section) => section.items.some((item) => item.id === activeItemId));
  const activeItem = activeSection?.items.find((item) => item.id === activeItemId);

  return (
    <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-5 lg:self-start">
        <nav
          aria-label="后台分区导航"
          className="rounded-lg border border-[#adb3b4]/20 bg-white p-3 shadow-[0_20px_55px_rgba(45,52,53,0.045)]"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#adb3b4]/15 pb-3">
            <div>
              <p className="text-sm font-semibold text-[#202829]">后台工作区</p>
              <p className="mt-0.5 text-xs text-[#5a6061]">按运营任务分组</p>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:block lg:space-y-4">
            {sections.map((section) => (
              <section key={section.id} className="min-w-0">
                <p className="mb-1.5 px-2 text-[11px] font-semibold text-[#5a6061]">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = item.id === activeItemId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-current={active ? "page" : undefined}
                        title={item.description}
                        onClick={() => onSelectItem(item.id)}
                        className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          active
                            ? "bg-[#2d3435] text-[#f8f8f8]"
                            : "text-[#5a6061] hover:bg-[#f2f4f4] hover:text-[#202829]"
                        }`}
                      >
                        <span className={active ? "text-[#f8f8f8]" : "text-[#5a6061]"}>{item.icon}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                        {typeof item.count === "number" && item.count > 0 ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                              active ? "bg-white/15 text-[#f8f8f8]" : "bg-[#f2f4f4] text-[#2d3435]"
                            }`}
                          >
                            {item.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>
      </aside>

      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-2 border-b border-[#adb3b4]/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {activeSection ? (
              <p className="text-xs font-medium text-[#5a6061]">{activeSection.label}</p>
            ) : null}
            <h2 className="mt-1 text-xl font-semibold text-[#202829]">{activeItem?.label || "后台管理"}</h2>
            {activeItem?.description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5a6061]">{activeItem.description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
