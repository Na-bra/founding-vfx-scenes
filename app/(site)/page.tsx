import Link from "next/link";
import { ArrowRight, Clapperboard, MessageSquarePlus, Sparkles } from "lucide-react";
import { getRepository } from "@/lib/data";
import { Hero } from "@/components/home/Hero";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { ChannelCard, CollectionCard, GenreCard, PlaylistCard, ShowCard } from "@/components/cards/EntityCards";
import { RequestCard } from "@/components/requests/RequestCard";
import { Button } from "@/components/ui/Button";
import { EmptyState, SectionHeader } from "@/components/ui/Primitives";
import { formatMonth } from "@/lib/format";
import styles from "./home.module.css";

export default async function HomePage() {
  const repo = getRepository();
  const [counts, featured, recent, shows, channels, genres, playlists, collections, mostWanted, latestRequests, changelog] =
    await Promise.all([
      repo.getSiteCounts(),
      repo.getFeaturedScenePacks(8),
      repo.getRecentScenePacks(8),
      repo.listShows(),
      repo.listChannels(),
      repo.listGenres(),
      repo.listPlaylists({ featured: true }),
      repo.listCollections({ featured: true }),
      repo.listRequests({ tab: "popular", limit: 3 }),
      repo.listRequests({ tab: "new", limit: 6 }),
      repo.getChangelog(),
    ]);

  // Without analytics, "popular" is defined transparently by library size.
  const popularShows = [...shows].sort((a, b) => b.scenePackCount - a.scenePackCount).slice(0, 6);
  const wallPacks = recent.length >= 6 ? recent : [...recent, ...featured].slice(0, 9);
  const latestChange = changelog[0];
  const wantedIds = new Set(mostWanted.map((r) => r.id));
  const newestRequests = latestRequests.filter((r) => !wantedIds.has(r.id)).slice(0, 3);
  const genresWithContent = genres.filter((g) => g.scenePackCount > 0);

  return (
    <>
      <Hero
        wallPacks={wallPacks}
        counts={counts}
        quickSearches={popularShows.slice(0, 5).map((s) => ({ label: s.title, href: `/shows/${s.slug}` }))}
      />

      {counts.scenePacks === 0 ? (
        <section className="section container">
          <EmptyState
            icon={<Clapperboard size={26} aria-hidden />}
            title="ScenePacks are coming soon."
            description="The first ScenePacks are being prepared. In the meantime, tell us what you want to see first."
            action={
              <Button href="/requests" icon={<MessageSquarePlus size={18} aria-hidden />}>
                Browse requests
              </Button>
            }
          />
        </section>
      ) : (
        <div className={styles.sections}>
          {featured.length > 0 && (
            <section className="container" aria-labelledby="featured-title">
              <SectionHeader
                id="featured-title"
                eyebrow="Featured"
                title="Featured ScenePacks"
                description="Hand-picked by the FoundingVFX team."
                href="/scenepacks"
              />
              <div className="rail">
                {featured.slice(0, 4).map((p, i) => (
                  <ScenePackCard key={p.id} pack={p} priority={i < 2} />
                ))}
              </div>
            </section>
          )}

          <section className="container" aria-labelledby="new-title">
            <SectionHeader
              id="new-title"
              eyebrow="Just added"
              title="Recently Added"
              description="The newest ScenePacks, in order of release."
              href="/scenepacks?sort=newest"
            />
            <div className="grid-cards">
              {recent.map((p) => (
                <ScenePackCard key={p.id} pack={p} showDate />
              ))}
            </div>
          </section>

          <section className={styles.band} aria-labelledby="shows-title">
            <div className="container">
              <SectionHeader
                id="shows-title"
                eyebrow="Shows"
                title="Popular Shows"
                description="Shows with the most ScenePacks in the library."
                href="/shows"
                linkLabel="All shows"
              />
              <div className="grid-posters">
                {popularShows.map((s) => (
                  <ShowCard key={s.id} show={s} />
                ))}
              </div>
            </div>
          </section>

          {channels.length > 0 && (
            <section className="container" aria-labelledby="channels-title">
              <SectionHeader id="channels-title" eyebrow="Channels" title="Browse Channels" href="/channels" />
              <div className="grid-tiles">
                {channels.map((c) => (
                  <ChannelCard key={c.id} channel={c} />
                ))}
              </div>
            </section>
          )}

          {genresWithContent.length > 0 && (
            <section className="container" aria-labelledby="genres-title">
              <SectionHeader id="genres-title" eyebrow="Genres" title="Browse Genres" href="/genres" />
              <div className={styles.genreGrid}>
                {genresWithContent.map((g) => (
                  <GenreCard key={g.id} genre={g} />
                ))}
              </div>
            </section>
          )}

          {playlists.length > 0 && (
            <section className="container" aria-labelledby="playlists-title">
              <SectionHeader
                id="playlists-title"
                eyebrow="Curated"
                title="Featured Playlists"
                description="Themed sets of ScenePacks, arranged by the team."
                href="/playlists"
              />
              <div className={styles.playlistGrid}>
                {playlists.slice(0, 3).map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </section>
          )}

          {collections.length > 0 && (
            <section className="container" aria-labelledby="collections-title">
              <SectionHeader id="collections-title" eyebrow="Collections" title="Collections" href="/collections" />
              <div className={styles.collectionGrid}>
                {collections.slice(0, 2).map((c) => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </div>
            </section>
          )}

          <section className={`container ${styles.requests}`} aria-labelledby="requests-title">
            <div className={styles.requestsIntro}>
              <p className="eyebrow">Community</p>
              <h2 id="requests-title" className={styles.requestsTitle}>
                Can&rsquo;t find the ScenePack you&rsquo;re looking for?
              </h2>
              <p className="lead">Request it and let the FoundingVFX community show what they want next.</p>
              <div className={styles.requestsActions}>
                <Button href="/requests/new" icon={<MessageSquarePlus size={18} aria-hidden />}>
                  Request a ScenePack
                </Button>
                <Button href="/requests" variant="secondary">
                  Browse requests
                </Button>
              </div>
            </div>
            <div className={styles.requestLists}>
              {mostWanted.length > 0 && (
                <div>
                  <h3 className={styles.listTitle}>Most Wanted</h3>
                  <div className={styles.requestStack}>
                    {mostWanted.map((r, i) => (
                      <RequestCard key={r.id} request={r} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
              {newestRequests.length > 0 && (
                <div>
                  <h3 className={styles.listTitle}>Latest Requests</h3>
                  <div className={styles.requestStack}>
                    {newestRequests.map((r) => (
                      <RequestCard key={r.id} request={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {latestChange && (
            <section className="container" aria-labelledby="whatsnew-title">
              <div className={styles.whatsNew}>
                <div>
                  <p className="eyebrow">
                    <Sparkles size={14} aria-hidden /> What&rsquo;s new · {formatMonth(latestChange.date)}
                  </p>
                  <h2 id="whatsnew-title" className={styles.whatsNewTitle}>
                    {latestChange.title}
                  </h2>
                </div>
                <ul className={styles.changes}>
                  {latestChange.changes.slice(0, 4).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <Link href="/changelog" className={styles.changelogLink}>
                  Full changelog <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
