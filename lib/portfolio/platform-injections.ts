/**
 * Serve-Time Platform Injections
 *
 * Pure functions that inject platform code (tracking, contact forms, analytics)
 * into portfolio files at serve-time. This means changing code here and deploying
 * the main app instantly updates ALL portfolios — no need to re-generate or
 * re-upload anything.
 *
 * The blob stores ONLY the raw creative output from Claude.
 */

// =====================================================
// HTML Injection — Head Tags
// =====================================================

/**
 * Get platform tags to inject into <head>.
 * Includes scoped styles for the community badge widget.
 */
export function getPlatformHeadTags(_subdomain: string): string {
  return getCommunityBadgeStyles();
}

// =====================================================
// HTML Injection — Body Tags
// =====================================================

/**
 * Get platform tags to inject before </body>.
 * Includes the tracking pixel and community badge widget.
 */
export function getPlatformBodyTags(subdomain: string): string {
  const trackingPixel = `<img src="https://ugc.community/api/portfolio/track?subdomain=${subdomain}" width="1" height="1" style="position:absolute;opacity:0;pointer-events:none" alt="" aria-hidden="true" />`;
  const badge = getCommunityBadgeHtml();

  return `  <!-- UGC Community Platform -->\n  ${trackingPixel}\n  ${badge}`;
}

// =====================================================
// Community Badge Widget
// =====================================================

/**
 * Scoped CSS for the community badge.
 * All selectors are prefixed with `#ugc-badge` to avoid
 * collisions with creator portfolio styles.
 */
function getCommunityBadgeStyles(): string {
  return `<style id="ugc-badge-styles">
  #ugc-badge {
    --ugc-bg: rgba(15, 15, 15, 0.75);
    --ugc-bg-hover: rgba(15, 15, 15, 0.92);
    --ugc-text: rgba(255, 255, 255, 0.88);
    --ugc-text-dim: rgba(255, 255, 255, 0.5);
    --ugc-accent: #c8ff32;
    --ugc-radius: 20px;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1;
    pointer-events: auto;
    animation: ugcBadgeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.5s both;
  }

  #ugc-badge a {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 8px 10px;
    background: var(--ugc-bg);
    backdrop-filter: blur(16px) saturate(1.8);
    -webkit-backdrop-filter: blur(16px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--ugc-radius);
    color: var(--ugc-text);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.24),
      0 8px 24px rgba(0, 0, 0, 0.16);
  }

  #ugc-badge a:hover {
    background: var(--ugc-bg-hover);
    border-color: rgba(255, 255, 255, 0.14);
    transform: translateY(-2px);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.28),
      0 12px 32px rgba(0, 0, 0, 0.22);
  }

  #ugc-badge a:hover #ugc-badge-dot {
    background: var(--ugc-accent);
    box-shadow: 0 0 8px var(--ugc-accent);
  }

  #ugc-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ugc-text-dim);
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  #ugc-badge-label {
    letter-spacing: 0.02em;
    font-weight: 500;
    white-space: nowrap;
  }

  @keyframes ugcBadgeIn {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.92);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    #ugc-badge {
      bottom: 12px;
      right: 12px;
      font-size: 11px;
    }
    #ugc-badge a {
      padding: 7px 10px 7px 8px;
    }
  }
</style>`;
}

/**
 * HTML for the community badge widget.
 * A small frosted-glass pill in the bottom-right corner
 * that links back to ugc.community.
 */
function getCommunityBadgeHtml(): string {
  return `<div id="ugc-badge" role="complementary" aria-label="UGC Community badge">
  <a href="https://ugc.community" target="_blank" rel="noopener noreferrer" title="Part of ugc.community">
    <span id="ugc-badge-dot" aria-hidden="true"></span>
    <span id="ugc-badge-label">ugc.community</span>
  </a>
</div>`;
}

// =====================================================
// HTML Injection — Combined
// =====================================================

/**
 * Inject all platform code into an HTML document.
 * Inserts head tags before </head> and body tags before </body>.
 *
 * This is the serve-time equivalent of the old `injectTrackingAndContactForm()`
 * from portfolio-generator.ts, but only handles HTML concerns.
 */
export function injectPlatformCode(html: string, subdomain: string): string {
  let result = html;

  // Inject head tags (if any)
  const headTags = getPlatformHeadTags(subdomain);
  if (headTags) {
    result = result.replace(/<\/head>/i, `${headTags}\n</head>`);
  }

  // Inject body tags (tracking pixel, etc.)
  const bodyTags = getPlatformBodyTags(subdomain);
  if (bodyTags) {
    result = result.replace(/<\/body>/i, `${bodyTags}\n</body>`);
  }

  return result;
}

// =====================================================
// JavaScript Injection — Contact Form Handler
// =====================================================

/**
 * Get the contact form handler JavaScript to append to script.js.
 * This IIFE attaches a submit handler to #contact-form that POSTs
 * to the platform API with the creator's subdomain.
 */
export function getContactFormHandler(subdomain: string): string {
  return `
// =====================================================
// Contact Form Handler (UGC Community Integration)
// =====================================================
(function() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Send';

    if (submitBtn) {
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
    }

    const formData = {
      name: contactForm.querySelector('[name="name"]')?.value || '',
      email: contactForm.querySelector('[name="email"]')?.value || '',
      company: contactForm.querySelector('[name="company"]')?.value || '',
      message: contactForm.querySelector('[name="message"]')?.value || '',
      creatorSubdomain: '${subdomain}'
    };

    try {
      const response = await fetch('https://ugc.community/api/portfolio/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (submitBtn) submitBtn.textContent = 'Message Sent!';
        contactForm.reset();
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
          }
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      if (submitBtn) {
        submitBtn.textContent = 'Error - Try Again';
        submitBtn.disabled = false;
        setTimeout(() => {
          submitBtn.textContent = originalBtnText;
        }, 3000);
      }
    }
  });
})();
`;
}
