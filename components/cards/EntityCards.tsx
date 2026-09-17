import Link from "next/link";
import { ArrowUpRight, Clapperboard, LibraryBig, ListVideo } from "lucide-react";
import type {
  ChannelSummary,
  CharacterSummary,
  CollectionSummary,
  GenreSummary,
  PlaylistSummary,
  ShowSummary,
} from "@/lib/data/repository";
import { Artwork } from "@/components/ui/Artwork";
import { formatCount, formatYears } from "@/lib/format";
import styles from "./EntityCards.module.css";

export function ShowCard({ show, priority }: { show: ShowSummary; priority?: boolean }) {
  return (
    <article className={styles.poster}>
      <Link href={`/shows/${show.slug}`} className={styles.posterLink}>
        <div className={styles.posterMedia}>
          <Artwork
            seed={show.slug}
            image={show.poster}
            label={show.title}
            sublabel={show.channel.name}
            variant="poster"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 25vw, 16vw"
            className={styles.zoom}
          />
          <span className={styles.posterCount}>
            <Clapperboard size={13} aria-hidden /> {show.scenePackCount}
          </span>
        </div>
        <div className={styles.posterBody}>
          <h3 className={styles.posterTitle}>{show.title}</h3>
          <p className={styles.sub}>
            {formatYears(show.yearStart, show.yearEnd)} · {show.channel.name}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function CharacterCard({ character }: { character: CharacterSummary }) {
  return (
    <article>
      <Link href={`/characters/${character.slug}`} className={styles.character}>
        <span className={styles.avatar}>
          <Artwork seed={character.slug} image={character.artwork} variant="square" showLabel={false} sizes="72px" />
          <span className={styles.initials} aria-hidden>
            {character.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
        </span>
        <span className={styles.characterText}>
          <span className={styles.characterName}>{character.name}</span>
          <span className={styles.sub}>{character.show.title}</span>
          <span className={styles.subtle}>{formatCount(character.scenePackCount, "ScenePack")}</span>
        </span>
      </Link>
    </article>
  );
}

export function ChannelCard({ channel }: { channel: ChannelSummary }) {
  return (
    <article className={styles.tile}>
      <Link href={`/channels/${channel.slug}`} className={styles.tileLink}>
        <Artwork seed={`channel-${channel.slug}`} image={channel.artwork} variant="landscape" showLabel={false} className={styles.tileArt} />
        <span className={styles.tileShade} aria-hidden />
        <span className={styles.tileContent}>
          <span className={styles.tileTitle}>{channel.name}</span>
          <span className={styles.tileMeta}>
            {formatCount(channel.showCount, "show")} · {formatCount(channel.scenePackCount, "pack")}
          </span>
        </span>
        <ArrowUpRight className={styles.tileArrow} size={18} aria-hidden />
      </Link>
    </article>
  );
}

export function GenreCard({ genre }: { genre: GenreSummary }) {
  return (
    <article className={`${styles.tile} ${styles.genre}`}>
      <Link href={`/genres/${genre.slug}`} className={styles.tileLink}>
        <Artwork seed={`genre-${genre.slug}`} image={genre.artwork} variant="landscape" showLabel={false} className={styles.tileArt} />
        <span className={styles.tileShade} aria-hidden />
        <span className={styles.tileContent}>
          <span className={styles.tileTitle}>{genre.name}</span>
          <span className={styles.tileMeta}>{formatCount(genre.scenePackCount, "ScenePack")}</span>
        </span>
        <ArrowUpRight className={styles.tileArrow} size={18} aria-hidden />
      </Link>
    </article>
  );
}

export function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  const covers = playlist.coverPacks.slice(0, 3);
  return (
    <article className={styles.stackCard}>
      <Link href={`/playlists/${playlist.slug}`} className={styles.stackLink}>
        <div className={styles.stackMedia}>
          {covers.length === 0 ? (
            <Artwork seed={playlist.slug} image={playlist.thumbnail} label={playlist.title} className={styles.stackLayer} />
          ) : (
            covers
              .slice()
              .reverse()
              .map((p, i, arr) => (
                <Artwork
                  key={p.id}
                  seed={p.slug}
                  image={p.thumbnail}
                  label={i === arr.length - 1 ? playlist.title : undefined}
                  sublabel={i === arr.length - 1 ? `${playlist.scenePackCount} packs` : undefined}
                  className={styles.stackLayer}
                  sizes="(max-width: 640px) 90vw, 30vw"
                />
              ))
          )}
        </div>
        <div className={styles.stackBody}>
          <p className={styles.stackKicker}>
            <ListVideo size={14} aria-hidden /> Playlist · {formatCount(playlist.scenePackCount, "pack")}
          </p>
          <h3 className={styles.stackTitle}>{playlist.title}</h3>
          <p className={styles.sub}>{playlist.description}</p>
        </div>
      </Link>
    </article>
  );
}

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  return (
    <article className={styles.collection}>
      <Link href={`/collections/${collection.slug}`} className={styles.collectionLink}>
        <Artwork
          seed={collection.slug}
          image={collection.artwork}
          label={collection.title}
          showLabel={false}
          variant="banner"
          className={styles.collectionArt}
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <span className={styles.collectionShade} aria-hidden />
        <span className={styles.collectionContent}>
          <span className={styles.collectionKicker}>
            <LibraryBig size={14} aria-hidden /> Collection · {formatCount(collection.itemCount, "item")}
          </span>
          <span className={styles.collectionTitle}>{collection.title}</span>
          <span className={styles.collectionDesc}>{collection.description}</span>
        </span>
      </Link>
    </article>
  );
}

