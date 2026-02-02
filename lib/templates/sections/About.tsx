/**
 * About Section Component
 *
 * Variants:
 * - default: Photo + bio side by side
 * - centered: Photo above, bio below, centered
 * - with-stats: Includes stat cards
 * - timeline: Career timeline format
 */

import type { SectionContent, Media, User } from "@/lib/db/schema";
import type { AboutVariant } from "../types";

export interface AboutProps {
  variant?: AboutVariant;
  content?: SectionContent;
  user?: User;
  mediaMap?: Map<string, Media>;
}

export function About({ variant = "default", content, user, mediaMap }: AboutProps) {
  const {
    title = "About Me",
    bio,
    profileMediaId,
    stats,
  } = content ?? {};

  // Use profile media from content, or fall back to user's profile image
  const profileMedia = profileMediaId
    ? mediaMap?.get(profileMediaId)
    : undefined;
  const profileImageUrl = profileMedia?.url ?? user?.image ?? null;

  // Use bio from content, or fall back to user's bio
  const displayBio = bio ?? user?.bio;

  switch (variant) {
    case "centered":
      return (
        <AboutCentered
          title={title}
          bio={displayBio}
          profileImageUrl={profileImageUrl}
          stats={stats}
        />
      );
    case "with-stats":
      return (
        <AboutWithStats
          title={title}
          bio={displayBio}
          profileImageUrl={profileImageUrl}
          stats={stats}
        />
      );
    case "timeline":
      return (
        <AboutTimeline
          title={title}
          bio={displayBio}
          profileImageUrl={profileImageUrl}
          stats={stats}
        />
      );
    case "default":
    default:
      return (
        <AboutDefault
          title={title}
          bio={displayBio}
          profileImageUrl={profileImageUrl}
          stats={stats}
        />
      );
  }
}

// =====================================================
// Shared Types
// =====================================================

interface AboutBaseProps {
  title?: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  stats?: Array<{ label: string; value: string }>;
}

// =====================================================
// Variant: Default (Side by Side)
// =====================================================

function AboutDefault({ title, bio, profileImageUrl, stats }: AboutBaseProps) {
  return (
    <section
      className="about about--default"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
          display: "grid",
          gridTemplateColumns: profileImageUrl ? "1fr 1.5fr" : "1fr",
          gap: "4rem",
          alignItems: "center",
        }}
      >
        <style>{`
          @media (max-width: 768px) {
            .about--default > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        
        {/* Profile Image */}
        {profileImageUrl && (
          <div
            style={{
              aspectRatio: "1",
              borderRadius: "var(--border-radius)",
              overflow: "hidden",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <img
              src={profileImageUrl}
              alt={title ?? "Profile"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div>
          {title && (
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                fontWeight: 600,
                marginBottom: "1.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>
          )}
          {bio && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                lineHeight: 1.7,
                color: "var(--color-text-secondary)",
                marginBottom: stats?.length ? "2rem" : 0,
              }}
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          )}
          
          {/* Inline Stats */}
          {stats && stats.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "2rem",
                flexWrap: "wrap",
                paddingTop: "1.5rem",
                borderTop: `1px solid var(--color-border)`,
              }}
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// =====================================================
// Variant: Centered
// =====================================================

function AboutCentered({ title, bio, profileImageUrl, stats }: AboutBaseProps) {
  return (
    <section
      className="about about--centered"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Profile Image */}
        {profileImageUrl && (
          <div
            style={{
              width: "180px",
              height: "180px",
              marginLeft: "auto",
              marginRight: "auto",
              marginBottom: "2rem",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <img
              src={profileImageUrl}
              alt={title ?? "Profile"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 600,
              marginBottom: "1.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
        )}

        {/* Bio */}
        {bio && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--font-size-base)",
              lineHeight: 1.8,
              color: "var(--color-text-secondary)",
              marginBottom: stats?.length ? "2.5rem" : 0,
            }}
            dangerouslySetInnerHTML={{ __html: bio }}
          />
        )}

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "3rem",
              flexWrap: "wrap",
            }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Variant: With Stats Cards
// =====================================================

function AboutWithStats({ title, bio, profileImageUrl, stats }: AboutBaseProps) {
  return (
    <section
      className="about about--with-stats"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Top Section: Image + Bio */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: profileImageUrl ? "300px 1fr" : "1fr",
            gap: "3rem",
            alignItems: "start",
            marginBottom: stats?.length ? "3rem" : 0,
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .about--with-stats > div > div:first-child {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          
          {/* Profile Image */}
          {profileImageUrl && (
            <div
              style={{
                aspectRatio: "3/4",
                borderRadius: "var(--border-radius)",
                overflow: "hidden",
                boxShadow: "var(--shadow)",
              }}
            >
              <img
                src={profileImageUrl}
                alt={title ?? "Profile"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Content */}
          <div>
            {title && (
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {title}
              </h2>
            )}
            {bio && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--font-size-base)",
                  lineHeight: 1.7,
                  color: "var(--color-text-secondary)",
                }}
                dangerouslySetInnerHTML={{ __html: bio }}
              />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && stats.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
              gap: "1.5rem",
            }}
          >
            <style>{`
              @media (max-width: 768px) {
                .about--with-stats .stats-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
            `}</style>
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stats-grid"
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--color-background)",
                  borderRadius: "var(--border-radius)",
                  textAlign: "center",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Variant: Timeline
// =====================================================

function AboutTimeline({ title, bio, profileImageUrl, stats }: AboutBaseProps) {
  // For timeline, we treat stats as timeline entries
  // Each stat becomes a timeline point with value as year/date and label as description
  
  return (
    <section
      className="about about--timeline"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          {profileImageUrl && (
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src={profileImageUrl}
                alt={title ?? "Profile"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
          <div>
            {title && (
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {title}
              </h2>
            )}
            {bio && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--font-size-base)",
                  lineHeight: 1.6,
                  color: "var(--color-text-secondary)",
                }}
                dangerouslySetInnerHTML={{ __html: bio }}
              />
            )}
          </div>
        </div>

        {/* Timeline */}
        {stats && stats.length > 0 && (
          <div
            style={{
              position: "relative",
              paddingLeft: "2rem",
            }}
          >
            {/* Timeline Line */}
            <div
              style={{
                position: "absolute",
                left: "0.5rem",
                top: "0.5rem",
                bottom: "0.5rem",
                width: "2px",
                backgroundColor: "var(--color-border)",
              }}
            />

            {/* Timeline Items */}
            {stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  paddingBottom: i < stats.length - 1 ? "2rem" : 0,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-1.625rem",
                    top: "0.25rem",
                    width: "0.75rem",
                    height: "0.75rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent)",
                    border: `3px solid var(--color-background)`,
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default About;
