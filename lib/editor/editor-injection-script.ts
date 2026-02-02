/**
 * Script to be injected into the iframe for element selection
 * This is serialized and injected as a string
 */

export const EDITOR_INJECTION_SCRIPT = `
(function() {
  // Prevent double initialization
  if (window.__editorInitialized) return;
  window.__editorInitialized = true;

  const HIGHLIGHT_COLOR = 'rgba(255, 107, 149, 0.3)';
  const SELECTED_COLOR = 'rgba(255, 107, 149, 0.5)';
  const BORDER_COLOR = '#ff6b95';

  // Media-specific colors (purple)
  const MEDIA_HIGHLIGHT_COLOR = 'rgba(147, 51, 234, 0.3)';
  const MEDIA_BORDER_COLOR = '#9333ea';

  // Elements that can be edited (text)
  const EDITABLE_TAGS = [
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'SPAN', 'A', 'LI', 'TD', 'TH',
    'LABEL', 'BUTTON', 'FIGCAPTION',
    'BLOCKQUOTE', 'CITE', 'Q',
    'STRONG', 'EM', 'B', 'I', 'U',
    'SMALL', 'MARK', 'DEL', 'INS',
    'DIV', 'TIME', 'ADDRESS', 'DD', 'DT', 'CAPTION', 'LEGEND'
  ];

  // Media elements that can be edited
  const MEDIA_TAGS = ['IMG', 'VIDEO', 'PICTURE', 'FIGURE'];

  let selectedElement = null;
  let highlightOverlay = null;
  let selectionOverlay = null;
  let loadingOverlay = null;
  let currentHoveredElement = null;
  let loadingElement = null;
  let isDesignMode = false;

  // Create overlay element
  function createOverlay(id) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = \`
      position: absolute;
      pointer-events: none;
      z-index: 999999;
      transition: all 0.15s ease-out;
      border-radius: 4px;
    \`;
    document.body.appendChild(overlay);
    return overlay;
  }

  // Create loading overlay with blur effect
  function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'editor-loading-overlay';
    overlay.innerHTML = \`
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b95" stroke-width="2" style="animation: spin 1s linear infinite;">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 16h5v5"/>
        </svg>
      </div>
    \`;
    overlay.style.cssText = \`
      position: absolute;
      z-index: 999998;
      display: none;
      backdrop-filter: blur(4px);
      background: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
      border: 2px solid #ff6b95;
      pointer-events: none;
    \`;

    // Add keyframe animation for spinner
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    \`;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    return overlay;
  }

  // Show loading state on element
  function showLoadingOnElement(selector) {
    const element = document.querySelector(selector);
    if (!element || !loadingOverlay) return;

    loadingElement = element;
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.top = \`\${rect.top + scrollY - 2}px\`;
    loadingOverlay.style.left = \`\${rect.left + scrollX - 2}px\`;
    loadingOverlay.style.width = \`\${rect.width + 4}px\`;
    loadingOverlay.style.height = \`\${rect.height + 4}px\`;

    // Hide hover states
    highlightOverlay.style.display = 'none';
  }

  // Hide loading state
  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    loadingElement = null;
  }

  // Initialize overlays
  highlightOverlay = createOverlay('editor-highlight-overlay');
  selectionOverlay = createOverlay('editor-selection-overlay');
  selectionOverlay.style.border = \`2px solid \${BORDER_COLOR}\`;
  selectionOverlay.style.boxShadow = \`0 0 0 2px rgba(255, 107, 149, 0.2)\`;
  loadingOverlay = createLoadingOverlay();

  // Generate unique CSS selector for element
  function generateSelector(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body && current.parentElement) {
      const parent = current.parentElement;
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current.tagName
      );

      if (siblings.length === 1) {
        path.unshift(current.tagName.toLowerCase());
      } else {
        const index = siblings.indexOf(current) + 1;
        path.unshift(\`\${current.tagName.toLowerCase()}:nth-of-type(\${index})\`);
      }

      current = parent;
    }

    return 'body > ' + path.join(' > ');
  }

  // Check if element has direct text content (not just text in children)
  function hasDirectTextContent(element) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  // Check if element is a media element
  function isMediaEditable(element) {
    if (!element || element === document.body) return false;
    return MEDIA_TAGS.includes(element.tagName);
  }

  // Extract media data from an element
  function extractMediaData(element) {
    const tagName = element.tagName.toUpperCase();
    const data = {
      type: tagName === 'VIDEO' ? 'video' : 'image',
      src: '',
      alt: undefined,
      width: undefined,
      height: undefined,
      poster: undefined,
      duration: undefined,
      autoplay: undefined,
      loop: undefined,
      muted: undefined,
      srcset: undefined,
      sizes: undefined
    };

    if (tagName === 'IMG') {
      data.src = element.src || '';
      data.alt = element.alt || '';
      data.width = element.naturalWidth || element.width || undefined;
      data.height = element.naturalHeight || element.height || undefined;
      data.srcset = element.srcset || undefined;
      data.sizes = element.sizes || undefined;
    } else if (tagName === 'VIDEO') {
      data.type = 'video';
      data.src = element.src || element.querySelector('source')?.src || '';
      data.poster = element.poster || undefined;
      data.width = element.videoWidth || element.width || undefined;
      data.height = element.videoHeight || element.height || undefined;
      data.duration = element.duration || undefined;
      data.autoplay = element.autoplay;
      data.loop = element.loop;
      data.muted = element.muted;
    } else if (tagName === 'PICTURE') {
      const img = element.querySelector('img');
      if (img) {
        data.src = img.src || '';
        data.alt = img.alt || '';
        data.width = img.naturalWidth || img.width || undefined;
        data.height = img.naturalHeight || img.height || undefined;
      }
    } else if (tagName === 'FIGURE') {
      const img = element.querySelector('img');
      const video = element.querySelector('video');
      if (img) {
        data.src = img.src || '';
        data.alt = img.alt || '';
        data.width = img.naturalWidth || img.width || undefined;
        data.height = img.naturalHeight || img.height || undefined;
      } else if (video) {
        data.type = 'video';
        data.src = video.src || video.querySelector('source')?.src || '';
        data.poster = video.poster || undefined;
        data.width = video.videoWidth || video.width || undefined;
        data.height = video.videoHeight || video.height || undefined;
        data.autoplay = video.autoplay;
        data.loop = video.loop;
        data.muted = video.muted;
      }
    }

    return data;
  }

  // Check if element is editable (text or media)
  function isEditable(element) {
    if (!element || element === document.body) return false;

    // Check if it's a media element
    if (MEDIA_TAGS.includes(element.tagName)) {
      return true;
    }

    // Check if it's an editable text tag
    if (EDITABLE_TAGS.includes(element.tagName)) {
      // Make sure it has meaningful content
      const text = element.textContent?.trim();
      if (!text || text.length === 0) return false;

      // For container elements like DIV, only consider editable if:
      // 1. It has direct text content, OR
      // 2. It has no editable child elements (it's a leaf)
      if (element.tagName === 'DIV') {
        if (hasDirectTextContent(element)) return true;
        // Check if any children are editable - if so, prefer those
        const children = element.querySelectorAll(EDITABLE_TAGS.join(','));
        for (const child of children) {
          if (child.textContent?.trim().length > 0) {
            return false; // Has editable children, so don't select this div
          }
        }
        return true; // No editable children, this div can be selected
      }

      return true;
    }

    return false;
  }

  // Find closest editable parent
  function findEditableElement(element) {
    let current = element;
    while (current && current !== document.body) {
      if (isEditable(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Position overlay over element
  function positionOverlay(overlay, element, color) {
    if (!element) {
      overlay.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    overlay.style.display = 'block';
    overlay.style.top = \`\${rect.top + scrollY - 2}px\`;
    overlay.style.left = \`\${rect.left + scrollX - 2}px\`;
    overlay.style.width = \`\${rect.width + 4}px\`;
    overlay.style.height = \`\${rect.height + 4}px\`;
    overlay.style.backgroundColor = color;
  }

  // Send message to parent
  function postToParent(type, payload) {
    window.parent.postMessage({ type, payload }, '*');
  }

  // Handle mouse move for hover highlight (only in design mode)
  document.addEventListener('mousemove', (e) => {
    if (!isDesignMode) {
      highlightOverlay.style.display = 'none';
      document.body.style.cursor = 'default';
      return;
    }

    const editableElement = findEditableElement(e.target);

    if (editableElement && editableElement !== selectedElement) {
      currentHoveredElement = editableElement;
      const isMedia = isMediaEditable(editableElement);
      const hoverColor = isMedia ? MEDIA_HIGHLIGHT_COLOR : HIGHLIGHT_COLOR;
      positionOverlay(highlightOverlay, editableElement, hoverColor);
      document.body.style.cursor = 'pointer';

      const payload = {
        selector: generateSelector(editableElement),
        content: editableElement.innerHTML,
        tagName: editableElement.tagName,
        outerHtml: editableElement.outerHTML,
        rect: editableElement.getBoundingClientRect()
      };

      // Add media data for media elements
      if (isMedia) {
        payload.mediaData = extractMediaData(editableElement);
      }

      postToParent('element-hover', payload);
    } else if (!editableElement) {
      currentHoveredElement = null;
      highlightOverlay.style.display = 'none';
      document.body.style.cursor = 'default';
      postToParent('element-unhover', null);
    }
  });

  // Handle click for selection (only in design mode)
  document.addEventListener('click', (e) => {
    if (!isDesignMode) return;

    e.preventDefault();
    e.stopPropagation();

    const editableElement = findEditableElement(e.target);

    if (editableElement) {
      selectedElement = editableElement;
      highlightOverlay.style.display = 'none';
      const isMedia = isMediaEditable(editableElement);

      // Update selection overlay border color for media
      if (isMedia) {
        selectionOverlay.style.border = '2px solid ' + MEDIA_BORDER_COLOR;
        selectionOverlay.style.boxShadow = '0 0 0 2px rgba(147, 51, 234, 0.2)';
      } else {
        selectionOverlay.style.border = '2px solid ' + BORDER_COLOR;
        selectionOverlay.style.boxShadow = '0 0 0 2px rgba(255, 107, 149, 0.2)';
      }

      positionOverlay(selectionOverlay, editableElement, 'transparent');

      const rect = editableElement.getBoundingClientRect();
      const payload = {
        selector: generateSelector(editableElement),
        content: editableElement.innerHTML,
        tagName: editableElement.tagName,
        outerHtml: editableElement.outerHTML,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      };

      // Add media data for media elements
      if (isMedia) {
        payload.mediaData = extractMediaData(editableElement);
      }

      postToParent(isMedia ? 'media-selected' : 'element-selected', payload);
    }
  }, true);

  // Handle scroll to reposition selection
  window.addEventListener('scroll', () => {
    if (selectedElement) {
      positionOverlay(selectionOverlay, selectedElement, 'transparent');
    }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    if (selectedElement) {
      positionOverlay(selectionOverlay, selectedElement, 'transparent');
    }
  });

  // Generate CSS from design system
  function generateDesignSystemCSS(design) {
    const { colors, fonts, radius, shadows } = design;
    
    const shadowValue = shadows.preset === 'none' 
      ? 'none' 
      : shadows.xOffset + 'px ' + shadows.yOffset + 'px ' + shadows.blur + 'px ' + shadows.spread + 'px rgba(0,0,0,' + shadows.opacity + ')';
    
    return \`
      :root {
        --primary: \${colors.colors.primary};
        --primary-foreground: \${colors.colors.primaryForeground};
        --secondary: \${colors.colors.secondary};
        --secondary-foreground: \${colors.colors.secondaryForeground};
        --accent: \${colors.colors.accent};
        --accent-foreground: \${colors.colors.accentForeground};
        --background: \${colors.colors.background};
        --foreground: \${colors.colors.foreground};
        --card: \${colors.colors.card};
        --card-foreground: \${colors.colors.cardForeground};
        --muted: \${colors.colors.muted};
        --muted-foreground: \${colors.colors.mutedForeground};
        --radius: \${radius}rem;
        --shadow: \${shadowValue};
        --font-sans: "\${fonts.sans}", system-ui, sans-serif;
        --font-serif: "\${fonts.serif}", Georgia, serif;
        --font-mono: "\${fonts.mono}", monospace;
      }
      body {
        font-family: var(--font-\${fonts.defaultStyle});
        background-color: var(--background);
        color: var(--foreground);
      }
      img, .card, [class*='card'] {
        border-radius: var(--radius);
      }
    \`;
  }

  // Apply design system to page
  function applyDesignSystem(design) {
    let styleEl = document.querySelector('style#design-system-live');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'design-system-live';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateDesignSystemCSS(design);
  }

  // Apply styles to a specific element
  function applyElementStyles(selector, styles) {
    const element = document.querySelector(selector);
    if (element) {
      Object.keys(styles).forEach(function(key) {
        element.style[key] = styles[key];
      });
    }
  }

  // Listen for messages from parent
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'set-design-mode') {
      isDesignMode = e.data.enabled;
      // Hide overlays when leaving design mode
      if (!isDesignMode) {
        highlightOverlay.style.display = 'none';
        selectionOverlay.style.display = 'none';
        selectedElement = null;
        currentHoveredElement = null;
        document.body.style.cursor = 'default';
      }
    }
    if (e.data?.type === 'deselect') {
      selectedElement = null;
      selectionOverlay.style.display = 'none';
      hideLoading();
    }
    if (e.data?.type === 'update-selection' && e.data?.selector) {
      // Re-find and highlight updated element
      const element = document.querySelector(e.data.selector);
      if (element) {
        selectedElement = element;
        positionOverlay(selectionOverlay, element, 'transparent');
      }
    }
    if (e.data?.type === 'start-loading' && e.data?.selector) {
      showLoadingOnElement(e.data.selector);
    }
    if (e.data?.type === 'stop-loading') {
      hideLoading();
    }
    if (e.data?.type === 'scroll-to' && e.data?.selector) {
      const element = document.querySelector(e.data.selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (e.data?.type === 'apply-design-system' && e.data?.designSystem) {
      applyDesignSystem(e.data.designSystem);
    }
    if (e.data?.type === 'apply-element-styles' && e.data?.selector && e.data?.styles) {
      applyElementStyles(e.data.selector, e.data.styles);
    }
  });

  // Notify parent that editor is ready
  postToParent('ready', null);
})();
`;

/**
 * Get the injection script as a data URL for srcdoc
 */
export function getInjectionScriptTag(): string {
  return `<script>${EDITOR_INJECTION_SCRIPT}</script>`;
}

/**
 * Inject the editor script into HTML content
 */
export function injectEditorScript(html: string): string {
  const scriptTag = getInjectionScriptTag();

  // Insert before closing body tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${scriptTag}</body>`);
  }

  // Fallback: append to end
  return html + scriptTag;
}
