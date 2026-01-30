/**
 * Apify Provider Test Fixtures
 *
 * Sample payloads for testing the Apify hashtag monitoring provider.
 * These match the actual output schemas from Apify actors.
 *
 * Usage:
 * - Import these fixtures in tests
 * - Use for manual testing via the webhook endpoint
 * - Reference for understanding expected payload formats
 */

/**
 * Sample Apify webhook notification
 * This is sent when an actor run completes
 */
export const sampleWebhookNotification = {
  userId: "user123",
  createdAt: "2026-01-30T10:30:00.000Z",
  eventType: "ACTOR.RUN.SUCCEEDED",
  eventData: {
    actorId: "apify/instagram-hashtag-scraper",
    actorRunId: "run123",
    status: "SUCCEEDED",
  },
  resource: {
    defaultDatasetId: "dataset123",
  },
};

/**
 * Instagram Post Sample
 * From: apify/instagram-hashtag-scraper
 *
 * Key fields:
 * - ownerUsername: Author's Instagram handle
 * - shortCode: Used to construct post URL
 * - likesCount: -1 if hidden by user
 */
export const sampleInstagramPosts = [
  {
    id: "3123456789012345678",
    shortCode: "DNkLN-Ooe8t",
    ownerUsername: "ugc_creator_jane",
    ownerFullName: "Jane Smith | UGC Creator",
    caption:
      "Loving this new product! #ugccommunity #sponsored #contentcreator",
    likesCount: 1234,
    commentsCount: 56,
    videoViewCount: undefined,
    timestamp: 1706616000,
    hashtags: ["ugccommunity", "sponsored", "contentcreator"],
    url: "https://www.instagram.com/p/DNkLN-Ooe8t/",
    displayUrl:
      "https://scontent.cdninstagram.com/v/t51.29350-15/image.jpg",
    type: "Image",
    isVerified: false,
    followersCount: 15000,
  },
  {
    id: "3123456789012345679",
    shortCode: "DNkLN-Ooe8u",
    ownerUsername: "brand_ambassador_mike",
    ownerFullName: "Mike Johnson",
    caption: "Check out my latest reel! #ugccommunity #reels",
    likesCount: -1, // Hidden by user
    commentsCount: 23,
    videoViewCount: 5678,
    timestamp: "2026-01-30T09:00:00.000Z",
    hashtags: ["ugccommunity", "reels"],
    displayUrl: "https://scontent.cdninstagram.com/v/t51.29350-15/video.jpg",
    type: "Video",
    isVerified: true,
    followersCount: 50000,
  },
];

/**
 * TikTok Post Sample
 * From: clockworks/tiktok-scraper or clockworks/tiktok-hashtag-scraper
 *
 * Key fields:
 * - authorMeta.name: Author's TikTok handle
 * - diggCount: Likes (TikTok calls them "diggs")
 * - hashtags: Array of { name: string }
 */
export const sampleTikTokPosts = [
  {
    id: "7123456789012345678",
    text: "POV: You finally get paid for your UGC content #ugccommunity #fyp #ugccreator",
    webVideoUrl: "https://www.tiktok.com/@ugc_sarah/video/7123456789012345678",
    authorMeta: {
      name: "ugc_sarah",
      nickName: "Sarah | UGC Creator",
      verified: false,
      signature: "UGC Creator | DM for collabs",
      fans: 25000,
    },
    videoMeta: {
      duration: 15,
      coverUrl:
        "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/cover.jpg",
    },
    diggCount: 45600,
    shareCount: 1234,
    playCount: 890000,
    commentCount: 567,
    collectCount: 2345,
    createTimeISO: "2026-01-30T08:00:00.000Z",
    hashtags: [
      { name: "ugccommunity" },
      { name: "fyp" },
      { name: "ugccreator" },
    ],
  },
  {
    id: "7123456789012345679",
    text: "How I make $5k/month with UGC #ugccommunity #sidehustle",
    webVideoUrl: "https://www.tiktok.com/@contentking/video/7123456789012345679",
    authorMeta: {
      name: "contentking",
      nickName: "Content King",
      verified: true,
      fans: 100000,
    },
    videoMeta: {
      duration: 60,
      coverUrl: "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/cover2.jpg",
    },
    diggCount: 123000,
    shareCount: 5678,
    playCount: 2500000,
    commentCount: 3456,
    collectCount: 8901,
    createTime: 1706601600, // Unix timestamp alternative
    hashtags: [{ name: "ugccommunity" }, { name: "sidehustle" }],
  },
];

/**
 * Twitter/X Post Sample
 * From: apidojo/tweet-scraper
 *
 * Supports two formats:
 * 1. Nested user object (full_text, user.screen_name)
 * 2. Flat structure (text, username)
 */
export const sampleTwitterPosts = [
  // Nested user object format
  {
    id_str: "1234567890123456789",
    full_text:
      "Just joined #ugccommunity and already landed my first brand deal! So excited to connect with fellow creators.",
    user: {
      screen_name: "ugc_emma",
      name: "Emma | UGC Creator",
      verified: false,
      followers_count: 5000,
    },
    retweet_count: 45,
    favorite_count: 234,
    reply_count: 12,
    quote_count: 5,
    created_at: "Thu Jan 30 10:00:00 +0000 2026",
    entities: {
      hashtags: [{ text: "ugccommunity" }],
    },
  },
  // Flat structure format (some scrapers use this)
  {
    id: "1234567890123456790",
    text: "Best decision I made was focusing on UGC content. #ugccommunity changed my life!",
    username: "creator_alex",
    displayName: "Alex Rivera",
    isVerified: true,
    followersCount: 25000,
    retweetCount: 123,
    likeCount: 890,
    replyCount: 34,
    viewCount: 15000,
    createdAt: "2026-01-30T11:30:00.000Z",
    hashtags: ["ugccommunity"],
    tweetUrl: "https://twitter.com/creator_alex/status/1234567890123456790",
  },
];

/**
 * YouTube Video Sample
 * From: streamers/youtube-scraper
 *
 * Key fields:
 * - channelName/channelHandle: Channel identifier
 * - viewCount: Number of views
 * - duration: Can be seconds or ISO 8601 format (PT5M30S)
 */
export const sampleYouTubePosts = [
  {
    id: "dQw4w9WgXcQ",
    title: "How I Made $10k My First Month as a UGC Creator | #ugccommunity",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    viewCount: 125000,
    likes: 4500,
    likeCount: 4500,
    commentCount: 234,
    date: "2026-01-28",
    channelName: "UGC Success Stories",
    channelUrl: "https://www.youtube.com/@ugcsuccessstories",
    channelHandle: "ugcsuccessstories",
    numberOfSubscribers: 50000,
    details:
      "In this video, I share my journey from zero to $10k as a UGC creator...",
    duration: 845, // 14 minutes 5 seconds
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    keywords: ["ugccommunity", "ugc creator", "content creation"],
  },
  {
    id: "abc123XYZ",
    title: "UGC Creator Tips for Beginners #ugccommunity",
    url: "https://www.youtube.com/watch?v=abc123XYZ",
    viewCount: 45000,
    likes: 1200,
    commentCount: 89,
    uploadDate: "2026-01-29T15:00:00.000Z",
    channelName: "Creator Academy",
    channelUrl: "https://www.youtube.com/channel/UCabc123",
    subscriberCount: 25000,
    description: "Learn the basics of becoming a successful UGC creator...",
    duration: "PT12M30S", // ISO 8601 format
    thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
    keywords: ["ugccommunity", "beginner tips"],
  },
];

/**
 * Facebook Post Sample
 * From: apify/facebook-posts-scraper
 *
 * Key fields:
 * - pageName: Page/profile name
 * - pageUrl: Used to extract handle
 * - reactions/likes: Engagement count
 */
export const sampleFacebookPosts = [
  {
    postId: "123456789_987654321",
    postUrl: "https://www.facebook.com/ugccommunityofficial/posts/987654321",
    pageName: "UGC Community Official",
    pageUrl: "https://www.facebook.com/ugccommunityofficial",
    text: "Welcome to all our new members! Share your #ugccommunity journey below.",
    likes: 567,
    reactions: 623,
    comments: 89,
    shares: 34,
    time: "2026-01-30T12:00:00.000Z",
    isVerified: true,
    followersCount: 15000,
  },
  {
    postId: "234567890_876543210",
    postUrl: "https://www.facebook.com/creatorhub/posts/876543210",
    pageName: "Creator Hub",
    pageUrl: "https://www.facebook.com/creatorhub",
    pageHandle: "creatorhub",
    text: "Tips for getting started with UGC content creation. #ugccommunity #contentcreators",
    reactionsCount: 234,
    commentsCount: 45,
    sharesCount: 12,
    timestamp: 1706623200,
    isVerified: false,
  },
];

/**
 * Combined webhook payload with direct items
 * Some Apify configurations include items directly in the webhook
 */
export const sampleWebhookWithDirectItems = {
  userId: "user123",
  createdAt: "2026-01-30T10:30:00.000Z",
  eventType: "ACTOR.RUN.SUCCEEDED",
  eventData: {
    actorId: "clockworks/tiktok-scraper",
    actorRunId: "run456",
    status: "SUCCEEDED",
  },
  items: sampleTikTokPosts,
};

/**
 * Expected parsed output for Instagram posts
 */
export const expectedInstagramParsedPosts = [
  {
    platform: "instagram",
    postUrl: "https://www.instagram.com/p/DNkLN-Ooe8t/",
    postId: "3123456789012345678",
    authorHandle: "ugc_creator_jane",
    authorName: "Jane Smith | UGC Creator",
    content:
      "Loving this new product! #ugccommunity #sponsored #contentcreator",
    engagement: {
      likes: 1234,
      comments: 56,
      views: undefined,
    },
    metadata: {
      hashtags: ["ugccommunity", "sponsored", "contentcreator"],
      thumbnailUrl:
        "https://scontent.cdninstagram.com/v/t51.29350-15/image.jpg",
      isVerified: false,
      followerCount: 15000,
    },
  },
];

/**
 * Expected parsed output for TikTok posts
 */
export const expectedTikTokParsedPosts = [
  {
    platform: "tiktok",
    postUrl: "https://www.tiktok.com/@ugc_sarah/video/7123456789012345678",
    postId: "7123456789012345678",
    authorHandle: "ugc_sarah",
    authorName: "Sarah | UGC Creator",
    content:
      "POV: You finally get paid for your UGC content #ugccommunity #fyp #ugccreator",
    engagement: {
      likes: 45600,
      views: 890000,
      comments: 567,
      shares: 1234,
      saves: 2345,
    },
    metadata: {
      hashtags: ["ugccommunity", "fyp", "ugccreator"],
      thumbnailUrl:
        "https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/cover.jpg",
      duration: 15,
      isVerified: false,
      followerCount: 25000,
    },
  },
];
