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
 * Currently empty — ready for analytics scripts, cookie banners, meta tags, etc.
 */
export function getPlatformHeadTags(_subdomain: string): string {
  // Future: analytics scripts, cookie consent, OG meta overrides, etc.
  return "";
}

// =====================================================
// HTML Injection — Body Tags
// =====================================================

/**
 * Get platform tags to inject before </body>.
 * Includes the tracking pixel for portfolio view counting.
 */
export function getPlatformBodyTags(subdomain: string): string {
  const trackingPixel = `<img src="https://ugc.community/api/portfolio/track?subdomain=${subdomain}" width="1" height="1" style="position:absolute;opacity:0;pointer-events:none" alt="" aria-hidden="true" />`;

  // Future: "Powered by UGC Community" badge, footer scripts, etc.
  return `  <!-- UGC Community Platform -->\n  ${trackingPixel}`;
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
