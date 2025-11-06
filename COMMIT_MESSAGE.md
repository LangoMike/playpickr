feat: Add game media carousel, search, and pagination features

This commit introduces comprehensive enhancements to the games browsing
experience, including visual media display, search functionality, and
pagination support.

## Game Media Carousel & Screenshots

### New Components
- **GameImageCarousel**: New reusable component for displaying game media
  - Supports both images (screenshots) and videos (trailers)
  - Main image displayed prominently with full-screen carousel
  - Thumbnail navigation bar with scrollable selection
  - Keyboard navigation support (ArrowLeft/ArrowRight)
  - Visual indicators for video content (play icon overlay, trailer badge)

### API Integration
- **/api/games/screenshots**: New API route for fetching game screenshots
  - Integrates with RAWG API `/games/{id}/screenshots` endpoint
  - Filters out deleted screenshots automatically
  - Returns structured screenshot data with image URLs

- **/api/games/trailers**: New API route for fetching game trailers
  - Integrates with RAWG API `/games/{id}/movies` endpoint
  - Handles missing trailers gracefully (returns empty results, not errors)
  - Improved error handling for 404 responses (expected for games without trailers)

### RAWG Library Updates
- Added `RAWGScreenshot` and `RAWGScreenshotResult` interfaces
- Added `RAWGTrailer` and `RAWGTrailerResult` interfaces
- Implemented `fetchGameScreenshots(gameId: number)` function
- Implemented `fetchGameTrailers(gameId: number)` function
- Extended game data type definitions for media support

### Game Detail Page Integration
- Integrated GameImageCarousel into GameDetailPage
- Carousel displays in order: Main Image → Trailer → Screenshots
- Responsive design with proper aspect ratios
- Smooth navigation between media items

## Video Trailer Integration

### Trailer Display
- Trailers appear as the second item in the carousel (after main image)
- HTML5 video player with controls for trailer playback
- Preview image (poster) shown before video loads
- "🎬 Trailer" badge indicator for video content
- Play icon overlay on trailer thumbnails in navigation bar

### Trailer Selection Logic
- Smart trailer filtering: prefers trailers with "trailer" in name
  (avoids gameplay videos, DLC trailers, spin-offs)
- Falls back to first available trailer if no official trailer found
- Comprehensive logging for debugging trailer selection
- Handles cases where games have no trailers available

## Search Functionality

### Games Page Search
- Real-time search input with debouncing (500ms delay)
- Searches games by title or tags using RAWG API
- Search bar integrated above games grid
- Responsive design with proper spacing

### API Route
- **/api/games/search**: New API route for game search
  - Supports query, page, and pageSize parameters
  - Returns paginated search results
  - Handles empty queries gracefully

### Search Behavior
- Automatically resets to page 1 when search query changes
- Maintains search state during navigation
- Works seamlessly with pagination and ordering

## Pagination System

### Features
- Full pagination controls with Previous/Next buttons
- Page number buttons with intelligent ellipsis display
  - Shows first page, last page, and surrounding pages
  - Ellipsis for large page ranges
  - Maximum 7 visible page numbers
- Current page highlighting
- Results counter: "Showing X to Y of Z games"
- Disabled states during loading
- Responsive design (stacks on mobile, horizontal on desktop)

### API Integration
- Updated trending API to support page parameter
- Updated search API to support page parameter
- Stores pagination metadata (count, next, previous) from API responses
- Page size set to 20 games per page

### User Experience
- Automatic scroll to top when page changes
- Resets to page 1 when:
  - Search query changes (after debounce)
  - Order/sort option changes
- Smooth scrolling behavior
- Loading states prevent interaction during fetch

## Bug Fixes

### Hydration Error Fix
- Fixed React hydration mismatch error in GameDetailPage
- Replaced `Math.random()` with deterministic calculations based on `game.id`
- Changed from: `#{Math.floor(Math.random() * 200) + 1} PLATFORMER`
- Changed to: `#{(game.id % 200) + 1} PLATFORMER`
- Ensures consistent server-side and client-side rendering

### Trailer Selection Improvements
- Enhanced trailer filtering to prefer official trailers
- Better error handling for missing trailers (no longer throws errors)
- Improved logging for debugging trailer availability
- Graceful fallback when no trailers are available

## UI/UX Improvements

### Game Detail Page
- Removed platform icons display (replaced with playtime)
- Improved visual hierarchy and spacing
- Better responsive design for mobile devices

### Styling
- Consistent gaming theme styling across new components
- Custom scrollbar hiding for thumbnail carousel
- Smooth transitions and animations
- Proper hover states and visual feedback

## Technical Details

### Component Architecture
- All new components are client-side ("use client")
- Proper TypeScript typing throughout
- Reusable and maintainable code structure
- Optimized with useCallback for performance

### Performance Optimizations
- Debounced search input to reduce API calls
- Parallel fetching of screenshots and trailers
- Efficient image loading with Next.js Image component
- Lazy loading for non-priority images

### Error Handling
- Comprehensive error handling in all API routes
- Graceful degradation when media is unavailable
- User-friendly error messages
- Console logging for debugging

## Files Changed

### New Files
- src/components/GameImageCarousel.tsx
- src/app/api/games/screenshots/route.ts
- src/app/api/games/trailers/route.ts
- src/app/api/games/search/route.ts

### Modified Files
- src/app/games/page.tsx (added search and pagination)
- src/components/GameDetailPage.tsx (integrated carousel, fixed hydration error)
- src/lib/rawg.ts (added screenshot and trailer functions/interfaces)
- src/components/GameCard.tsx (minor updates)

## Testing Recommendations

1. Test carousel navigation with keyboard and mouse
2. Verify trailer playback in different browsers
3. Test search functionality with various queries
4. Verify pagination across different page ranges
5. Test on mobile devices for responsive design
6. Verify error handling for games without media

---

Commit message generated by AI Assistant <assistant@cursor.sh>

