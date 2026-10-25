/** Tombstone for private endpoints from the retired portfolio/rewards program. */
export function retiredCreatorFeature() {
  return Response.json({
    error: "This creator-program feature has been retired. Use the job board, creator profile, and application history instead.",
    dashboard: "/dashboard",
    profile: "/apply-profile",
    jobs: "/jobs",
  }, { status: 410 });
}
