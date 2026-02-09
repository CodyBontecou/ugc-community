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
// Community Badge Widget (Pill)
// =====================================================

/**
 * Scoped CSS for the community pill badge.
 * A rounded pill badge in the bottom-right corner, styled to match
 * the ugc.community landing page aesthetic (coral-to-rose gradient,
 * Outfit font, warm shadows). Uses fully rounded borders (border-radius: 50px)
 * for an organic shape with no straight lines.
 *
 * All selectors are prefixed with `#ugc-badge` to avoid
 * collisions with creator portfolio styles.
 */
function getCommunityBadgeStyles(): string {
  return `<style id="ugc-badge-styles">
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500&display=swap');

  #ugc-badge {
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 2147483647;
    pointer-events: none;
    animation: ugcBadgeIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s both;
  }

  #ugc-badge a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 14px;
    background: linear-gradient(135deg, #FF9A8B 0%, #FF6B95 100%);
    border-radius: 50px;
    color: #fff;
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.03em;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    pointer-events: auto;
    box-shadow:
      0 2px 8px rgba(255, 107, 149, 0.35),
      0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  #ugc-badge a:hover {
    background: linear-gradient(135deg, #FF8A7A 0%, #FF5A85 100%);
    transform: scale(1.05);
    box-shadow:
      0 4px 14px rgba(255, 107, 149, 0.45),
      0 2px 5px rgba(0, 0, 0, 0.1);
  }

  #ugc-badge a:hover #ugc-badge-sparkle {
    transform: scale(1.3) rotate(15deg);
  }

  #ugc-badge-sparkle {
    font-size: 9px;
    transition: transform 0.3s ease;
    filter: brightness(1.2);
  }

  #ugc-badge-label {
    white-space: nowrap;
  }

  @keyframes ugcBadgeIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    #ugc-badge {
      bottom: 8px;
      right: 8px;
    }
    #ugc-badge a {
      font-size: 9px;
      padding: 5px 12px;
    }
  }
</style>`;
}

/**
 * HTML for the community pill badge widget.
 * A rounded pill badge in the bottom-right that links
 * back to ugc.community with a sparkle accent.
 */
function getCommunityBadgeHtml(): string {
  return `<div id="ugc-badge" role="complementary" aria-label="UGC Community badge">
  <a href="https://ugc.community" target="_blank" rel="noopener noreferrer" title="Part of ugc.community">
    <span id="ugc-badge-sparkle" aria-hidden="true">&#10022;</span>
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
  var contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  // Anti-spam: record when the form became interactive
  var _formLoadedAt = Date.now();

  // Anti-spam: inject a honeypot field (invisible to humans, bots auto-fill it)
  var _hp = document.createElement('input');
  _hp.type = 'text';
  _hp.name = '_hp_website';
  _hp.tabIndex = -1;
  _hp.autocomplete = 'off';
  _hp.setAttribute('aria-hidden', 'true');
  _hp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;opacity:0;pointer-events:none;';
  contactForm.appendChild(_hp);

  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var submitBtn = contactForm.querySelector('[type="submit"]');
    var originalBtnText = submitBtn ? submitBtn.textContent : 'Send';

    if (submitBtn) {
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
    }

    var formData = {
      name: contactForm.querySelector('[name="name"]')?.value || '',
      email: contactForm.querySelector('[name="email"]')?.value || '',
      company: contactForm.querySelector('[name="company"]')?.value || '',
      message: contactForm.querySelector('[name="message"]')?.value || '',
      creatorSubdomain: '${subdomain}',
      _hp_website: _hp.value,
      _ts: _formLoadedAt
    };

    try {
      var response = await fetch('https://ugc.community/api/portfolio/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      var data = await response.json();

      if (response.ok) {
        if (submitBtn) submitBtn.textContent = 'Message Sent!';
        contactForm.reset();
        _hp.value = '';
        setTimeout(function() {
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
        setTimeout(function() {
          submitBtn.textContent = originalBtnText;
        }, 3000);
      }
    }
  });
})();
`;
}
