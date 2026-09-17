import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getRepository } from "@/lib/data";
import { SearchBar } from "@/components/search/SearchBar";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { ChannelCard, CharacterCard, CollectionCard, GenreCard, PlaylistCard, ShowCard } from "@/components/cards/EntityCards";
import { Badge, Breadcrumbs, ChipLink, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/format";
import styles from "./search.module.css";
import body from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  const query = (Array.isArray(q) ? q[0] : q)?.trim();
  return { title: query ? `Search: ${query}` : "Search", robots: { index: false, follow: true }, alternates: { canonical: "/search" } };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const query = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, 120);
  const repo = getRepository();
  const [results, shows] = await Promise.all([query ? repo.search(query) : null, repo.listShows()]);
  const p = results?.parsed;
  const structured = p && [p.resolution, p.fps && `${p.fps} FPS`, p.season !== undefined && `Season ${p.season}`, p.episode !== undefined && `Episode ${p.episode}`].filter(Boolean);

  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
          <h1 className="page-title">{query ? <>Results for “{query}”</> : "Search"}</h1>
          <div className={styles.bar}>
            <SearchBar key={query} defaultValue={query} autoFocus={!query} />
          </div>
          {results && (
            <p className={styles.summary} aria-live="polite">
              {formatCount(results.total, "result")}
              {structured && structured.length > 0 && (
                <span className={styles.understood}>
                  Filtered by{" "}
                  {structured.map((s) => (
                    <Badge key={String(s)} tone="accent" mono>
                      {s}
                    </Badge>
                  ))}
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      <div className={`container ${body.body}`}>
        {!results && (
          <section aria-labelledby="browse-shows">
            <h2 id="browse-shows" className={body.sectionTitle}>
              Browse by show
            </h2>
            <div className={styles.chips}>
              {shows.map((s) => (
                <ChipLink key={s.id} href={`/shows/${s.slug}`}>
                  {s.title}
                </ChipLink>
              ))}
            </div>
          </section>
        )}

        {results && results.total === 0 && (
          <EmptyState
            icon={<SearchX size={26} aria-hidden />}
            title={`Nothing found for “${query}”.`}
            description="Check the spelling, try a character or show name, or request the ScenePack you're after."
            action={
              <>
                <Button href="/requests/new">Request a ScenePack</Button>
                <Button href="/scenepacks" variant="secondary">
                  Browse All ScenePacks
                </Button>
              </>
            }
          />
        )}

        {results && results.shows.length > 0 && (
          <section aria-labelledby="r-shows">
            <h2 id="r-shows" className={body.sectionTitle}>
              Shows <span className={body.sectionCount}>{results.shows.length}</span>
            </h2>
            <div className="grid-posters">
              {results.shows.map((s) => (
                <ShowCard key={s.id} show={s} />
              ))}
            </div>
          </section>
        )}

        {results && results.characters.length > 0 && (
          <section aria-labelledby="r-characters">
            <h2 id="r-characters" className={body.sectionTitle}>
              Characters <span className={body.sectionCount}>{results.characters.length}</span>
            </h2>
            <div className={body.characterGrid}>
              {results.characters.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          </section>
        )}

        {results && results.scenePacks.length > 0 && (
          <section aria-labelledby="r-packs">
            <h2 id="r-packs" className={body.sectionTitle}>
              ScenePacks <span className={body.sectionCount}>{results.scenePacks.length}</span>
            </h2>
            <div className="grid-cards">
              {results.scenePacks.map((pk) => (
                <ScenePackCard key={pk.id} pack={pk} />
              ))}
            </div>
            <div className={styles.more}>
              <Button href={`/scenepacks?q=${encodeURIComponent(query)}`} variant="secondary">
                Filter these ScenePacks
              </Button>
            </div>
          </section>
        )}

        {results && (results.channels.length > 0 || results.genres.length > 0) && (
          <section aria-labelledby="r-browse">
            <h2 id="r-browse" className={body.sectionTitle}>
              Channels &amp; genres
            </h2>
            <div className="grid-tiles">
              {results.channels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
              {results.genres.map((g) => (
                <GenreCard key={g.id} genre={g} />
              ))}
            </div>
          </section>
        )}

        {results && results.tags.length > 0 && (
          <section aria-labelledby="r-tags">
            <h2 id="r-tags" className={body.sectionTitle}>
              Tags
            </h2>
            <div className={styles.chips}>
              {results.tags.map((t) => (
                <ChipLink key={t.slug} href={`/scenepacks?tag=${t.slug}`}>
                  #{t.label}
                </ChipLink>
              ))}
            </div>
          </section>
        )}

        {results && (results.playlists.length > 0 || results.collections.length > 0) && (
          <section aria-labelledby="r-curated">
            <h2 id="r-curated" className={body.sectionTitle}>
              Playlists &amp; collections
            </h2>
            <div className={body.twoCol}>
              {results.playlists.map((pl) => (
                <PlaylistCard key={pl.id} playlist={pl} />
              ))}
              {results.collections.map((c) => (
                <CollectionCard key={c.id} collection={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
