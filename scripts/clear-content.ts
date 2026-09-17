/**
 * Deletes ALL content (ScenePacks, shows, characters, channels, genres, tags,
 * playlists, collections, requests, reports, announcements, changelog).
 *
 *   npm run db:clear -- --yes
 *
 * Admin accounts and the audit log are kept. Uploaded images stay in Supabase
 * Storage; remove them from the Storage dashboard if you want them gone.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.replace(/[?&]pgbouncer=true/, ""), ssl: { rejectUnauthorized: false } }),
});

async function main() {
  if (!process.argv.includes("--yes")) {
    const counts = await Promise.all([db.scenePack.count(), db.show.count(), db.playlist.count(), db.sceneRequest.count()]);
    console.log(`This will delete ${counts[0]} ScenePacks, ${counts[1]} shows, ${counts[2]} playlists and ${counts[3]} requests.`);
    console.log("Re-run with --yes to confirm:  npm run db:clear -- --yes");
    return;
  }

  await db.$transaction([
    db.collectionItem.deleteMany(),
    db.collection.deleteMany(),
    db.playlistItem.deleteMany(),
    db.playlist.deleteMany(),
    db.requestVote.deleteMany(),
    db.sceneRequest.deleteMany(),
    db.report.deleteMany(),
    db.favorite.deleteMany(),
    db.downloadEvent.deleteMany(),
    db.storageObject.deleteMany(),
    db.scenePackVersion.deleteMany(),
    db.previewMedia.deleteMany(),
    db.scenePackTag.deleteMany(),
    db.scenePackGenre.deleteMany(),
    db.scenePackCharacter.deleteMany(),
    db.scenePack.deleteMany(),
    db.character.deleteMany(),
    db.episode.deleteMany(),
    db.season.deleteMany(),
    db.showGenre.deleteMany(),
    db.show.deleteMany(),
    db.tag.deleteMany(),
    db.genre.deleteMany(),
    db.channel.deleteMany(),
    db.announcement.deleteMany(),
    db.changelogEntry.deleteMany(),
  ]);
  console.log("✔ All content deleted. Admin accounts kept.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
