import { Suspense } from "react";
import { Clapperboard, X } from "lucide-react";
import { getRepository } from "@/lib/data";
import type { FacetOption, ScenePackFacets } from "@/lib/data/repository";
import { features } from "@/config/features";
import { FilterPanel, SortSelect } from "@/components/filters/FilterPanel";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Button } from "@/components/ui/Button";
import { ChipLink, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { Pagination } from "@/components/ui/Pagination";
import { FILTER_KEYS, parseScenePackQuery } from "@/lib/scenepack-query";
import { pageMetadata } from "@/lib/seo";
import { formatCount } from "@/lib/format";
import styles from "./scenepacks.module.css";

export const metadata = pageMetadata({
  title: "ScenePacks",
  description: "Browse every ScenePack on FoundingVFX. Filter by show, character, channel, genre, resolution and FPS.",
  path: "/scenepacks",
});

const FACET_FOR: Record<(typeof FILTER_KEYS)[number], keyof ScenePackFacets> = {
  show: "shows",
  character: "characters",
  channel: "channels",
  genre: "genres",
  tag: "tags",
  season: "seasons",
  year: "years",
  resolution: "resolutions",
  fps: "fps",
  format: "formats",
  size: "sizes",
};

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently updated" },
  { value: "alphabetical", label: "Alphabetical" },
  ...(features.analytics
    ? [
        { value: "views", label: "Most viewed" },
        { value: "downloads", label: "Most downloaded" },
      ]
    : []),
];

export default async function ScenePacksPage({ searchParams }: PageProps<"/scenepacks">) {
  const raw = await searchParams;
  const query = parseScenePackQuery(raw);
  const repo = getRepository();
  const [result, facets] = await Promise.all([repo.listScenePacks({ ...query, pageSize: 12 }), repo.getScenePackFacets()]);

  const stringParams = Object.fromEntries(
    Object.entries(query).map(([k, v]) => [k, v === undefined ? undefined : String(v)]),
  ) as Record<string, string | undefined>;

  const activeFilters = FILTER_KEYS.filter((k) => stringParams[k] !== undefined).map((key) => {
    const value = stringParams[key]!;
    const label = facets[FACET_FOR[key]].find((o: FacetOption) => o.value === value)?.label ?? value;
    const rest = new URLSearchParams(
      Object.entries(stringParams).filter((e): e is [string, string] => e[0] !== key && e[0] !== "page" && Boolean(e[1])),
    ).toString();
    return { key, label, href: rest ? `/scenepacks?${rest}` : "/scenepacks" };
  });

  const clearHref = query.q ? `/scenepacks?q=${encodeURIComponent(query.q)}` : "/scenepacks";

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="ScenePacks"
        description="Every ScenePack on FoundingVFX. Combine filters to find exactly the clips your edit needs."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "ScenePacks" }]}
      />

      <div className={`container ${styles.layout}`}>
        <Suspense>
          <FilterPanel facets={facets} />
        </Suspense>

        <section className={styles.results} aria-labelledby="results-heading">
          <div className={styles.toolbar}>
            <h2 id="results-heading" className={styles.resultCount} aria-live="polite">
              {formatCount(result.total, "ScenePack")}
              {query.q && (
                <span className={styles.forQuery}>
                  {" "}
                  for “{query.q}”
                </span>
              )}
            </h2>
            <Suspense>
              <SortSelect options={SORTS} />
            </Suspense>
          </div>

          {activeFilters.length > 0 && (
            <ul className={styles.active} aria-label="Active filters">
              {activeFilters.map((f) => (
                <li key={f.key}>
                  <ChipLink href={f.href} active>
                    {f.label}
                    <X size={14} aria-label={`Remove ${f.label} filter`} />
                  </ChipLink>
                </li>
              ))}
            </ul>
          )}

          {result.items.length === 0 ? (
            <EmptyState
              icon={<Clapperboard size={26} aria-hidden />}
              title="No ScenePacks found."
              description="Try removing a filter or searching for a different show or character."
              action={
                <>
                  {activeFilters.length > 0 && <Button href={clearHref}>Clear Filters</Button>}
                  <Button href="/scenepacks" variant="secondary">
                    Browse All ScenePacks
                  </Button>
                </>
              }
            />
          ) : (
            <div className={`grid-cards ${styles.grid}`}>
              {result.items.map((p, i) => (
                <ScenePackCard key={p.id} pack={p} priority={i < 3} />
              ))}
            </div>
          )}

          <Pagination page={result.page} pageCount={result.pageCount} basePath="/scenepacks" params={stringParams} />
        </section>
      </div>
    </>
  );
}
