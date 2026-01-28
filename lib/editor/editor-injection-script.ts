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

  // Elements that can be edited
  const EDITABLE_TAGS = [
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'SPAN', 'A', 'LI', 'TD', 'TH',
    'LABEL', 'BUTTON', 'FIGCAPTION',
    'BLOCKQUOTE', 'CITE', 'Q',
    'STRONG', 'EM', 'B', 'I', 'U',
    'SMALL', 'MARK', 'DEL', 'INS',
    'DIV', 'TIME', 'ADDRESS', 'DD', 'DT', 'CAPTION', 'LEGEND'
  ];

  let selectedElement = null;
  let highlightOverlay = null;
  let selectionOverlay = null;

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

  // Initialize overlays
  highlightOverlay = createOverlay('editor-highlight-overlay');
  selectionOverlay = createOverlay('editor-selection-overlay');
  selectionOverlay.style.border = \`2px solid \${BORDER_COLOR}\`;
  selectionOverlay.style.boxShadow = \`0 0 0 2px rgba(255, 107, 149, 0.2)\`;

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

  // Check if element is editable
  function isEditable(element) {
    if (!element || element === document.body) return false;

    // Check if it's an editable tag
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

  // Handle mouse move for hover highlight
  document.addEventListener('mousemove', (e) => {
    const editableElement = findEditableElement(e.target);

    if (editableElement && editableElement !== selectedElement) {
      positionOverlay(highlightOverlay, editableElement, HIGHLIGHT_COLOR);
      document.body.style.cursor = 'pointer';

      postToParent('element-hover', {
        selector: generateSelector(editableElement),
        content: editableElement.innerHTML,
        tagName: editableElement.tagName,
        outerHtml: editableElement.outerHTML,
        rect: editableElement.getBoundingClientRect()
      });
    } else if (!editableElement) {
      highlightOverlay.style.display = 'none';
      document.body.style.cursor = 'default';
      postToParent('element-unhover', null);
    }
  });

  // Handle click for selection
  document.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const editableElement = findEditableElement(e.target);

    if (editableElement) {
      selectedElement = editableElement;
      highlightOverlay.style.display = 'none';
      positionOverlay(selectionOverlay, editableElement, 'transparent');

      const rect = editableElement.getBoundingClientRect();
      postToParent('element-selected', {
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
      });
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

  // Listen for deselection from parent
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'deselect') {
      selectedElement = null;
      selectionOverlay.style.display = 'none';
    }
    if (e.data?.type === 'update-selection' && e.data?.selector) {
      // Re-find and highlight updated element
      const element = document.querySelector(e.data.selector);
      if (element) {
        selectedElement = element;
        positionOverlay(selectionOverlay, element, 'transparent');
      }
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
