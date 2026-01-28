# Implementation Prompt: Media Upload & Management Epic

## Overview

Implement complete media upload and management functionality for the UGC Community portfolio editor. This enables users to upload, browse, select, and replace images/videos within their AI-generated portfolios.

## Current State

### Existing Infrastructure
- **Database Schema**: `media` table already exists in `lib/db/schema.ts` with fields: id, userId, portfolioId, type, filename, originalFilename, mimeType, size, url, thumbnailUrl, metadata (jsonb), timestamps
- **Storage**: Cloudflare R2 configured via environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)
- **Editor**: InteractiveHtmlEditor with iframe-based editing, postMessage communication, and AI edit panel
- **Injection Script**: `lib/editor/editor-injection-script.ts` handles element detection and highlighting (currently text elements only)
- **HTML Utilities**: `lib/editor/html-element-selector.ts` has element replacement functions (currently text-focused)

### Key Files to Reference
- `lib/db/schema.ts` - Database schema with media table
- `lib/editor/editor-injection-script.ts` - Iframe injection script
- `lib/editor/html-element-selector.ts` - HTML manipulation utilities
- `components/portfolio/interactive-editor/index.tsx` - Main editor
- `components/portfolio/interactive-editor/editable-iframe.tsx` - Iframe component
- `components/portfolio/interactive-editor/ai-edit-panel.tsx` - Reference for panel design
- `app/api/portfolio/html/route.ts` - Reference for API patterns

---

## Implementation Tasks (In Dependency Order)

### Task 1: Media Upload API Endpoint
**File**: `app/api/media/upload/route.ts`

Create POST endpoint for file uploads:

```typescript
// POST /api/media/upload
// Content-Type: multipart/form-data
// Body: file (File), portfolioId? (string)

// Response: { id, url, thumbnailUrl, type, filename, metadata }
```

**Requirements**:
1. Accept multipart form data with `file` field
2. Validate file types:
   - Images: jpg, jpeg, png, gif, webp (max 10MB)
   - Videos: mp4, webm (max 100MB)
3. Generate unique filename: `{userId}/{timestamp}-{random}.{ext}`
4. Upload to Cloudflare R2 using S3-compatible API
5. For videos: generate thumbnail (use ffmpeg or skip for MVP)
6. Insert record into `media` table
7. Return media object with public URL

**R2 Upload Pattern**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

---

### Task 2: Media HTML Replacement Utilities
**File**: `lib/editor/html-element-selector.ts`

Add these functions to existing file:

```typescript
// Check if element is media type
export function isMediaElement(tagName: string): boolean

// Replace image/video source URL
export function replaceMediaSrc(
  html: string,
  selector: string,
  newSrc: string,
  newAlt?: string
): string

// Update media attributes (alt, title, width, height, etc.)
export function updateMediaAttributes(
  html: string,
  selector: string,
  attributes: Record<string, string>
): string

// Wrap media element with figure/figcaption
export function wrapMediaWithFigure(
  html: string,
  selector: string,
  caption: string
): string

// Remove media element from HTML
export function removeMediaElement(html: string, selector: string): string

// Insert new media HTML after specified element
export function insertMediaAfter(
  html: string,
  selector: string,
  mediaHtml: string
): string
```

**Handle edge cases**:
- `srcset` attributes for responsive images
- `<picture>` elements with multiple `<source>` children
- `<video>` elements with `<source>` children
- Background images in inline styles

---

### Task 3: Image/Video Element Detection in Injection Script
**File**: `lib/editor/editor-injection-script.ts`

Extend the injection script to handle media elements:

1. Add media tags to `EDITABLE_TAGS`:
```typescript
const MEDIA_TAGS = ['IMG', 'VIDEO', 'PICTURE', 'FIGURE'];
```

2. Create media-specific overlay styling:
   - Use different border color (e.g., purple instead of blue) to distinguish from text
   - Show image/video icon instead of refresh icon

3. Extract media-specific data in postMessage:
```typescript
interface MediaElementData {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  // For video
  duration?: number;
  poster?: string;
}
```

4. Handle background images:
   - Detect `background-image` in inline styles
   - Extract URL and treat as selectable media element

---

### Task 4: Media Library Component and API
**Files**:
- `app/api/media/route.ts` (GET list, with pagination)
- `app/api/media/[id]/route.ts` (DELETE, PATCH)
- `components/media/media-library.tsx`

**API Endpoints**:

```typescript
// GET /api/media?type=image|video&page=1&limit=20
// Returns: { items: Media[], total: number, page: number, totalPages: number }

// DELETE /api/media/[id]
// Deletes from R2 and database

// PATCH /api/media/[id]
// Body: { alt?: string, caption?: string }
// Updates metadata
```

**Component Requirements**:
- Grid view with thumbnails (lazy loading)
- Filter tabs: All | Images | Videos
- Search by filename
- Selection mode (single select for replacement)
- Drag-and-drop upload zone at top
- Delete with confirmation dialog
- Empty state with upload CTA
- Loading states and error handling

**Component Props**:
```typescript
interface MediaLibraryProps {
  mode: 'browse' | 'select';
  onSelect?: (media: Media) => void;
  selectedId?: string;
  filterType?: 'image' | 'video' | 'all';
}
```

---

### Task 5: MediaEditPanel Component
**File**: `components/portfolio/interactive-editor/media-edit-panel.tsx`

Create panel similar to `ai-edit-panel.tsx` but for media:

**Layout**:
```
┌─────────────────────────────┐
│ [Current Media Preview]     │
│ 256x256 thumbnail           │
├─────────────────────────────┤
│ Quick Actions               │
│ [Remove] [Resize ▼]         │
│ [Add Caption]               │
├─────────────────────────────┤
│ Replace Media               │
│ [Upload New] [From Library] │
│ ─────── or ───────          │
│ [URL Input...............]  │
├─────────────────────────────┤
│ Alt Text (Accessibility)    │
│ [........................]  │
├─────────────────────────────┤
│ (Video only)                │
│ ☑ Autoplay  ☑ Loop  ☑ Muted │
└─────────────────────────────┘
```

**Features**:
1. Show current media preview/thumbnail
2. Quick actions:
   - Remove element
   - Resize presets: small (25%), medium (50%), large (75%), full-width (100%)
   - Add/edit caption (wraps in `<figure>`)
3. Replace options:
   - Upload new file (inline dropzone)
   - Browse media library (opens modal)
   - Enter URL directly
4. Alt text editor for accessibility
5. Video-specific controls: autoplay, loop, muted toggles

**Integration**:
- Conditionally render instead of AIEditPanel when `selectedElement.type === 'media'`
- Use `replaceMediaSrc` utility for replacement
- Call `updateMediaAttributes` for alt/video attributes

---

### Task 6: Add Media Button to Editor Toolbar
**File**: `components/portfolio/interactive-editor/index.tsx`

Add toolbar buttons for inserting new media:

1. Add "Add Image" button (icon: ImagePlus)
2. Add "Add Video" button (icon: Video)
3. On click, open MediaLibrary in select mode as modal
4. On selection, insert media HTML after current section or at cursor position

**Insert Logic**:
```typescript
const handleInsertMedia = (media: Media) => {
  const mediaHtml = media.type === 'image'
    ? `<img src="${media.url}" alt="${media.metadata?.alt || ''}" class="w-full rounded-lg" />`
    : `<video src="${media.url}" controls class="w-full rounded-lg"></video>`;

  const newHtml = insertMediaAfter(currentHtml, selectedSection, mediaHtml);
  setHtml(newHtml);
};
```

**Keyboard Shortcuts** (optional):
- `Cmd/Ctrl + Shift + I` - Insert image
- `Cmd/Ctrl + Shift + V` - Insert video

---

## Type Definitions

Add to `lib/editor/types.ts`:

```typescript
export interface MediaElementData {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  duration?: number;
  poster?: string;
  isBackgroundImage?: boolean;
}

export interface SelectedElement {
  // ... existing fields
  mediaData?: MediaElementData;
}
```

---

## Environment Variables Required

Ensure these are set in `.env.local`:
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=ugc-community-media
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

---

## Testing Checklist

- [ ] Upload image under 10MB - success
- [ ] Upload image over 10MB - rejected with error
- [ ] Upload video under 100MB - success
- [ ] Upload invalid file type - rejected
- [ ] Media library shows all user's uploads
- [ ] Filter by image/video works
- [ ] Delete media removes from R2 and database
- [ ] Select media from library replaces element in editor
- [ ] Alt text updates persist
- [ ] Video controls (autoplay/loop/muted) work
- [ ] Insert new image at end of section works
- [ ] Hover on image in editor shows media overlay (different color)
- [ ] Click on image opens MediaEditPanel (not AIEditPanel)

---

## Dependencies Between Tasks

```
Task 1 (Upload API)
    ↓
Task 4 (Media Library) ←── Task 2 (HTML Utilities)
    ↓                           ↓
Task 5 (MediaEditPanel) ←── Task 3 (Detection Script)
    ↓
Task 6 (Add Media Button)
```

**Recommended Implementation Order**:
1. Task 1 - Upload API (foundation)
2. Task 2 - HTML utilities (can parallel with Task 1)
3. Task 3 - Detection script (can parallel with Task 1)
4. Task 4 - Media library (needs Task 1)
5. Task 5 - MediaEditPanel (needs Tasks 2, 3, 4)
6. Task 6 - Add Media button (needs Tasks 4, 5)

---

## Package Dependencies

Install if not present:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Optional for video thumbnails:
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
```
