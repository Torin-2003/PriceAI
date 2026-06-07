"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Search, X } from "lucide-react";
import { getGuideCategory, guideCategories, guideEntries, type GuideCategoryId } from "@/lib/guides";

type ActiveCategory = "all" | GuideCategoryId;

export function GuidesDirectory() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");

  const filteredGuides = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return guideEntries.filter((guide) => {
      const category = getGuideCategory(guide.categoryId);
      const categoryMatched = activeCategory === "all" || guide.categoryId === activeCategory;
      const searchableText = [
        guide.title,
        guide.description,
        guide.intent,
        category?.label,
        ...guide.tags,
      ]
        .join(" ")
        .toLowerCase();

      return categoryMatched && (!keyword || searchableText.includes(keyword));
    });
  }, [activeCategory, query]);

  const activeCategoryLabel = activeCategory === "all" ? "全部指南" : getGuideCategory(activeCategory)?.label;
  const trimmedQuery = query.trim();
  const resultDescription =
    trimmedQuery && activeCategory !== "all"
      ? `正在查看“${activeCategoryLabel}”中包含“${trimmedQuery}”的指南。`
      : trimmedQuery
        ? `正在搜索包含“${trimmedQuery}”的指南。`
        : activeCategory !== "all"
          ? `正在查看“${activeCategoryLabel}”主题下的指南。`
          : "按标题、用途、标签和说明检索。";

  return (
    <section id="all-guides" className="mt-8 rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
      <div className="border-b border-[#edf0f1] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">全部指南</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-normal text-[#202829]">全部指南目录</h2>
            <p className="mt-2 text-sm leading-7 text-[#5a6061]">
              这里集中收录 PriceAI 目前所有指南。你可以搜索关键词，也可以按主题筛选。
            </p>
          </div>
          <div className="rounded-full bg-[#f2f4f4] px-4 py-2 text-sm font-semibold text-[#2d3435]">
            {filteredGuides.length} / {guideEntries.length} 篇
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6061]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索：ChatGPT、Google Play、礼品卡、虚拟卡、地区价、卡网..."
              className="h-12 w-full rounded-full bg-[#f9f9f9] pl-11 pr-11 text-sm text-[#2d3435] outline-none ring-1 ring-[#adb3b4]/20 transition placeholder:text-[#8b9293] focus:bg-white focus:ring-[#45bf78]/45"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#5a6061] transition hover:bg-[#e4e9ea] hover:text-[#202829]"
                aria-label="清空搜索"
              >
                <X size={15} />
              </button>
            ) : null}
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold text-[#5a6061] lg:pb-0">
            <CategoryButton
              label="全部"
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {guideCategories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.label}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-[#edf0f1] bg-[#f9f9f9] px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">主题筛选</p>
          <div className="mt-4 space-y-3">
            <CategorySummary
              title="全部指南"
              description="集中查看所有指南文档。"
              count={guideEntries.length}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {guideCategories.map((category) => (
              <CategorySummary
                key={category.id}
                title={category.label}
                description={category.description}
                count={guideEntries.filter((guide) => guide.categoryId === category.id).length}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between gap-3 border-b border-[#edf0f1] px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-[#202829]">{activeCategoryLabel}</p>
              <p className="mt-1 text-xs text-[#5a6061]">{resultDescription}</p>
            </div>
            {(query || activeCategory !== "all") ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
                className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#f2f4f4] px-3 text-sm font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                重置
              </button>
            ) : null}
          </div>

          {filteredGuides.length ? (
            <div className="divide-y divide-[#edf0f1]">
              {filteredGuides.map((guide) => {
                const category = getGuideCategory(guide.categoryId);

                return (
                  <Link
                    key={guide.href}
                    href={guide.href}
                    className="group grid gap-4 px-5 py-5 transition hover:bg-[#f9fbfa] sm:px-6 xl:grid-cols-[minmax(0,1fr)_180px]"
                  >
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 items-center rounded-full bg-[#e8f3ec] px-3 text-xs font-semibold text-[#2f7a4b]">
                          {category?.label}
                        </span>
                        <span className="text-sm text-[#5a6061]">{guide.intent}</span>
                      </span>
                      <span className="mt-3 block text-base font-bold text-[#202829]">{guide.title}</span>
                      <span className="mt-2 block text-sm leading-7 text-[#5a6061]">{guide.description}</span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        {guide.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[#f2f4f4] px-2.5 py-1 text-xs font-semibold text-[#5a6061]">
                            {tag}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="flex items-center justify-start xl:justify-end">
                      <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition group-hover:bg-[#202829]">
                        打开指南
                        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f4f4] text-[#5a6061]">
                <BookOpenText size={20} />
              </div>
              <h3 className="mt-4 font-semibold text-[#202829]">没有找到匹配的指南</h3>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">换一个关键词，或者清空筛选查看全部目录。</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
                className="mt-5 inline-flex h-10 items-center rounded-full bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
              >
                查看全部指南
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 transition ${
        active
          ? "bg-[#2d3435] text-[#f8f8f8]"
          : "bg-[#e4e9ea] text-[#5a6061] hover:bg-[#dde4e5] hover:text-[#202829]"
      }`}
    >
      {label}
    </button>
  );
}

function CategorySummary({
  title,
  description,
  count,
  active,
  onClick,
}: {
  title: string;
  description: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-3 text-left transition ${
        active ? "bg-[#2d3435] text-[#f8f8f8]" : "bg-white text-[#2d3435] ring-1 ring-[#adb3b4]/15 hover:bg-[#f2f4f4]"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{title}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-[#f8f8f8]/12" : "bg-[#f2f4f4] text-[#5a6061]"}`}>
          {count}
        </span>
      </span>
      <span className={`mt-1 block text-xs leading-5 ${active ? "text-[#d7dddd]" : "text-[#5a6061]"}`}>{description}</span>
    </button>
  );
}
