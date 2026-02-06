/**
 * Manual test script for the Scrape Creators integration.
 *
 * Tests each layer independently:
 * 1. Raw API calls (profile peek + video fetch)
 * 2. Post parsing logic
 * 3. Mention detection
 *
 * Usage:
 *   npx tsx scripts/test-scrapecreators.ts
 *
 * Optional: pass a TikTok handle to test with:
 *   npx tsx scripts/test-scrapecreators.ts --handle yourhandle
 */

import {
  getTikTokProfile,
  getTikTokProfileVideos,
  getInstagramProfile,
  getInstagramPosts,
  getYouTubeChannel,
  getYouTubeChannelShorts,
} from "../lib/hashtag-monitoring/providers/scrapecreators";
import { postContainsMention } from "../lib/hashtag-monitoring/profile-scraper";

const TEST_TIKTOK_HANDLE = process.argv.includes("--handle")
  ? process.argv[process.argv.indexOf("--handle") + 1]
  : "stoolpresidente"; // Public account with lots of videos

const TEST_INSTAGRAM_HANDLE = process.argv.includes("--ig-handle")
  ? process.argv[process.argv.indexOf("--ig-handle") + 1]
  : null;

const TEST_YOUTUBE_HANDLE = process.argv.includes("--yt-handle")
  ? process.argv[process.argv.indexOf("--yt-handle") + 1]
  : null;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

async function testTikTokProfile() {
  console.log(`\n🔍 Test 1: TikTok Profile Peek (@${TEST_TIKTOK_HANDLE})`);
  console.log("   This costs 1 credit.\n");

  try {
    const profile = await getTikTokProfile(TEST_TIKTOK_HANDLE);

    assert(!!profile.user, "Profile has user object");
    assert(!!profile.user.uniqueId, `uniqueId = "${profile.user.uniqueId}"`);
    assert(!!profile.user.nickname, `nickname = "${profile.user.nickname}"`);
    assert(typeof profile.stats.videoCount === "number", `videoCount = ${profile.stats.videoCount}`);
    assert(typeof profile.stats.followerCount === "number", `followerCount = ${profile.stats.followerCount}`);
    assert(profile.stats.videoCount > 0, "videoCount > 0");

    console.log(`\n   📊 Key stats: ${profile.stats.videoCount} videos, ${profile.stats.followerCount} followers`);
    return profile;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

async function testTikTokVideos() {
  console.log(`\n🎬 Test 2: TikTok Profile Videos (@${TEST_TIKTOK_HANDLE})`);
  console.log("   This costs additional credits.\n");

  try {
    const response = await getTikTokProfileVideos(TEST_TIKTOK_HANDLE);

    assert(Array.isArray(response.aweme_list), "Response has aweme_list array");
    assert(response.aweme_list.length > 0, `Got ${response.aweme_list.length} videos`);
    assert(typeof response.has_more === "number", `has_more = ${response.has_more}`);

    const firstVideo = response.aweme_list[0];
    assert(!!firstVideo.aweme_id, `First video ID = "${firstVideo.aweme_id}"`);
    assert(!!firstVideo.desc || firstVideo.desc === "", `First video desc exists (${firstVideo.desc?.substring(0, 50)}...)`);
    assert(!!firstVideo.statistics, "First video has statistics");
    assert(typeof firstVideo.statistics?.play_count === "number", `play_count = ${firstVideo.statistics?.play_count}`);
    assert(typeof firstVideo.create_time === "number", `create_time = ${firstVideo.create_time}`);
    assert(!!firstVideo.author, "First video has author object");
    assert(!!firstVideo.author?.unique_id, `author.unique_id = "${firstVideo.author?.unique_id}"`);

    // Check for URL field (added by Scrape Creators)
    const hasUrl = !!firstVideo.url;
    console.log(`\n   📊 First video: ${firstVideo.statistics?.play_count} plays, ${firstVideo.statistics?.digg_count} likes`);
    console.log(`   📎 URL field present: ${hasUrl}${hasUrl ? ` (${firstVideo.url})` : ""}`);
    console.log(`   📅 Created: ${new Date(firstVideo.create_time * 1000).toISOString()}`);

    return response;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

async function testInstagramProfile() {
  if (!TEST_INSTAGRAM_HANDLE) {
    console.log("\n📸 Test 3: Instagram Profile Peek — SKIPPED (pass --ig-handle to test)");
    return null;
  }

  console.log(`\n📸 Test 3: Instagram Profile (@${TEST_INSTAGRAM_HANDLE})`);
  console.log("   This costs 1 credit.\n");

  try {
    const profile = await getInstagramProfile(TEST_INSTAGRAM_HANDLE);

    assert(!!profile.username, `username = "${profile.username}"`);
    assert(typeof profile.media_count === "number", `media_count = ${profile.media_count}`);
    assert(typeof profile.follower_count === "number", `follower_count = ${profile.follower_count}`);
    assert(typeof profile.user_id === "string", `user_id = "${profile.user_id}"`);

    console.log(`\n   📊 Key stats: ${profile.media_count} posts, ${profile.follower_count} followers`);
    return profile;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

async function testInstagramPosts() {
  if (!TEST_INSTAGRAM_HANDLE) {
    console.log("\n📸 Test 4: Instagram Posts — SKIPPED (pass --ig-handle to test)");
    return null;
  }

  console.log(`\n📸 Test 4: Instagram Posts (@${TEST_INSTAGRAM_HANDLE})`);
  console.log("   This costs additional credits.\n");

  try {
    const response = await getInstagramPosts(TEST_INSTAGRAM_HANDLE);

    assert(Array.isArray(response.items), "Response has items array");
    assert(response.items.length > 0, `Got ${response.items.length} posts`);

    const firstPost = response.items[0];
    assert(!!firstPost.code, `First post code = "${firstPost.code}"`);
    assert(!!firstPost.id, `First post id = "${firstPost.id}"`);
    assert(typeof firstPost.like_count === "number", `like_count = ${firstPost.like_count}`);
    assert(typeof firstPost.taken_at === "number", `taken_at = ${firstPost.taken_at}`);

    const caption = firstPost.caption?.text || "";
    console.log(`\n   📊 First post: ${firstPost.like_count} likes, ${firstPost.comment_count} comments`);
    console.log(`   📎 URL: https://www.instagram.com/p/${firstPost.code}/`);
    console.log(`   📅 Posted: ${new Date((firstPost.taken_at || 0) * 1000).toISOString()}`);
    console.log(`   📝 Caption: "${caption.substring(0, 80)}..."`);

    return response;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

async function testYouTubeChannel() {
  if (!TEST_YOUTUBE_HANDLE) {
    console.log("\n📺 Test 5: YouTube Channel — SKIPPED (pass --yt-handle to test)");
    return null;
  }

  console.log(`\n📺 Test 5: YouTube Channel (@${TEST_YOUTUBE_HANDLE})`);
  console.log("   This costs 1 credit.\n");

  try {
    const channel = await getYouTubeChannel(TEST_YOUTUBE_HANDLE);

    assert(!!channel.channelId, `channelId = "${channel.channelId}"`);
    assert(!!channel.handle, `handle = "${channel.handle}"`);
    assert(!!channel.name, `name = "${channel.name}"`);
    assert(typeof channel.videoCount === "number", `videoCount = ${channel.videoCount}`);
    assert(channel.videoCount > 0, "videoCount > 0");
    assert(typeof channel.subscriberCount === "number", `subscriberCount = ${channel.subscriberCount}`);

    console.log(`\n   📊 Key stats: ${channel.videoCount} videos, ${channel.subscriberCount} subscribers`);
    return channel;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

async function testYouTubeShorts() {
  if (!TEST_YOUTUBE_HANDLE) {
    console.log("\n📺 Test 6: YouTube Shorts — SKIPPED (pass --yt-handle to test)");
    return null;
  }

  console.log(`\n📺 Test 6: YouTube Channel Shorts (@${TEST_YOUTUBE_HANDLE})`);
  console.log("   This costs additional credits.\n");

  try {
    const response = await getYouTubeChannelShorts(TEST_YOUTUBE_HANDLE);

    assert(Array.isArray(response.shorts), "Response has shorts array");
    assert(response.shorts.length > 0, `Got ${response.shorts.length} shorts`);

    const firstShort = response.shorts[0];
    assert(!!firstShort.id, `First short ID = "${firstShort.id}"`);
    assert(!!firstShort.url, `First short URL = "${firstShort.url}"`);
    assert(!!firstShort.title, `First short title = "${firstShort.title.substring(0, 50)}..."`);
    assert(typeof firstShort.viewCountInt === "number", `viewCountInt = ${firstShort.viewCountInt}`);
    assert(typeof firstShort.likeCountInt === "number", `likeCountInt = ${firstShort.likeCountInt}`);
    assert(typeof firstShort.commentCountInt === "number", `commentCountInt = ${firstShort.commentCountInt}`);
    assert(!!firstShort.publishDate, `publishDate = "${firstShort.publishDate}"`);

    console.log(`\n   📊 First short: ${firstShort.viewCountInt} views, ${firstShort.likeCountInt} likes`);
    console.log(`   📎 URL: ${firstShort.url}`);
    console.log(`   📅 Published: ${firstShort.publishDate}`);
    console.log(`   📝 Title: "${firstShort.title.substring(0, 80)}"`);

    // Check continuation token
    const hasContinuation = !!response.continuationToken;
    console.log(`   🔗 Continuation token: ${hasContinuation ? "present" : "none"}`);

    return response;
  } catch (error) {
    console.log(`  ❌ API call failed: ${error}`);
    failed++;
    return null;
  }
}

function testMentionDetection() {
  console.log("\n🏷️  Test 7: Mention Detection (no credits used)\n");

  assert(postContainsMention("Check out @ugc.community for tips!"), "Detects @ugc.community");
  assert(postContainsMention("Shoutout to @ugccommunity"), "Detects @ugccommunity");
  assert(postContainsMention("Thanks @ugc_community"), "Detects @ugc_community");
  assert(!postContainsMention("Just a normal post"), "Rejects normal post");
  assert(!postContainsMention("Email ugc.community@gmail.com"), "Rejects email-like");
  assert(!postContainsMention(null), "Handles null");
  assert(!postContainsMention(undefined), "Handles undefined");
  assert(!postContainsMention(""), "Handles empty string");
  assert(
    postContainsMention("POV: getting paid for UGC @ugc.community #fyp #ugccreator"),
    "Detects mention in realistic caption"
  );
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Scrape Creators Integration Test");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  API Key: ${process.env.SCRAPE_CREATORS_API_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`  TikTok handle: @${TEST_TIKTOK_HANDLE}`);
  console.log(`  Instagram handle: ${TEST_INSTAGRAM_HANDLE ? `@${TEST_INSTAGRAM_HANDLE}` : "not set (pass --ig-handle)"}`);
  console.log(`  YouTube handle: ${TEST_YOUTUBE_HANDLE ? `@${TEST_YOUTUBE_HANDLE}` : "not set (pass --yt-handle)"}`);

  if (!process.env.SCRAPE_CREATORS_API_KEY) {
    console.error("\n❌ SCRAPE_CREATORS_API_KEY not set. Source your .env.local first.");
    process.exit(1);
  }

  // Test 1-2: TikTok (costs ~2-3 credits total)
  await testTikTokProfile();
  await testTikTokVideos();

  // Test 3-4: Instagram (costs ~2-3 credits if handle provided)
  await testInstagramProfile();
  await testInstagramPosts();

  // Test 5-6: YouTube (costs ~2-3 credits if handle provided)
  await testYouTubeChannel();
  await testYouTubeShorts();

  // Test 7: Pure logic (free)
  testMentionDetection();

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
