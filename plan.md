# City Generation Tool Plan

## Notes
- The tool should demonstrate various city generation algorithms.
- Users must be able to blend between different algorithms.
- The tool should support non-grid layouts and topography-aware algorithms.
- Users should have controls to adjust density, scale, and randomize land features.
- Reference: Perplexity and Gemini UI/UX examples for city generation tools.
- Each algorithm should expose parameters for user control (e.g., grid size, density, randomness).
- For Wave Function Collapse, criteria for building type categories may be required.
- Best practices: modularity, performance, extensibility, and clear user feedback.
- The visual output will use squares and various shapes to represent parcels of land and buildings.

## Task List
- [x] Research and select city generation algorithms for demonstration
  - [x] Grid Layout (parameters: grid size, block variation, street width, density)
  - [x] Poisson Disk Sampling (parameters: min distance, max attempts)
  - [x] Random Walk (parameters: walker count, steps, deposit chance)
  - [x] Cellular Automata (parameters: generations, neighbor threshold, survival/birth rules)
  - [x] Voronoi Diagram (parameters: seed points, buildings per cell)
  - [x] Wave Function Collapse (parameters: tile size, constraint rules, entropy threshold)
    - [x] Define and categorize building types for Wave Function Collapse (see suggested tile taxonomy)
    - [x] Draft minimal tile-set JSON and adjacency matrix for WFC
- [x] Design user interface for algorithm selection and blending
  - [x] Sidebar for algorithm selection (see Perplexity/Gemini layouts)
  - [x] Sliders and inputs for algorithm parameters
  - [x] Blend sliders for algorithm weighting
  - [x] Export and statistics panel
- [x] Implement controls for density, scale, randomization, and custom seeds
- [x] Develop rendering logic for parcels and buildings (support squares, polygons, topography overlays)
- [x] Integrate algorithms with UI controls and real-time updates
- [x] Test blending and control functionality (side-by-side comparison, real-time feedback)
- [x] Polish UI/UX and provide clear feedback (color coding, legends, tooltips)
- [x] Document code and write README for extensibility
- [x] Create project folder and initialize git repository
- [x] Copy current plan.md into project folder
- [x] Create Windsurf rules file for plan synchronization

### 0. Deployment to GitHub Pages (June 2025)
- [x] Create `.github/workflows/deploy.yml` using `actions/upload-artifact@v4` and `actions/deploy-pages@v4`.
- [x] Add fallback workflow `.github/workflows/pages.yml` with `actions/upload-pages-artifact@v1`, `configure-pages@v4`, and `deploy-pages@v4`.
- [x] Commit and push workflows.
- [x] Fix incorrect action version (`upload-pages-artifact` → `v1`).
- [x] Verify workflow success and share public URL with team.

## Detailed Upcoming Tasks (Q3 2025)

### 1. Move legend outside canvas
- [x] Remove `drawLegend()` from renderer.
- [x] Create reusable Legend `<div>` with flex layout and color swatches.
- [x] Style with CSS variables for dark/light themes.
- [x] Position legend panel in sidebar under global controls.

### 2. Zoom & Pan interactions
- [x] Add `zoom` and `offset` state to `CityRenderer`.
- [x] Implement mouse wheel zoom that always centers on the pointer position (requires transforming offsets before scaling).
- [x] Implement pointer drag (mouse left / touch one-finger) to pan; update offsets.
- [x] Implement pinch-zoom and two-finger pan on touch devices.
- [x] Debounce redraws for performance; throttle to animation frame.
- [ ] Ensure all drawing helpers respect `zoom` & `offset`.

### 3. Dynamic scale bar
- [x] Compute real-world metres per pixel from `zoom`.
- [x] Choose ‘nice’ scale length (e.g. 50 m, 100 m, 250 m) based on rule of 2-5 cm on screen.
- [x] Update scale bar overlay text & width after zoom.

### 4. Slider UX + auto-enable
- [ ] Replace current range inputs with native sliders (keep) but attach `pointerdown/move` listeners for smooth drag in all browsers.
- [ ] On first drag event, automatically check the associated algorithm checkbox (if unchecked).
- [ ] Update weight normalisation after enabling.
- [ ] Visually highlight sliders that are active.

### 5. Drag-and-drop algorithm ordering
- [x] Wrap algorithm list in sortable container using SortableJS.
- [x] Persist order to `localStorage` for session recall.
- [ ] Modify blending logic: top list item weight counts as “primary” multiplier or first evaluation.
- [ ] Provide UI affordance (☰ grip icon).

### 6. Topography contour lines
- [ ] Increase resolution of elevation grid (e.g. 2× cell size) for smoother contours.
- [ ] Run Marching Squares to extract contour segments every N elevation units.
- [ ] Convert segments to Catmull-Rom splines for smooth curves.
- [ ] Render below roads/buildings in muted colour.

### 7. Roads & elevation interaction
- [ ] Add global probability slider “Roads follow terrain”.
- [ ] When true, road generator samples elevation along candidate path; if gradient > threshold, reroute (Bresenham climb) or terminate.
- [ ] For water bodies: truncate road N pixels before shoreline.
- [ ] Draw cul-de-sac cap for dead ends.

### 8. Advanced water generation (research)
- [x] Evaluate combining FBM Perlin + Worley noise for coastline generation.
- [x] Generate water mask from elevation grid via thresholding and connectivity (lakes, rivers, bays).
- [x] Apply smoothing (Marching Squares) to convert grid mask into natural polygonal coastlines.
- [x] Experiment with hydraulic erosion or flow-routing to carve river networks and drainage basins.
- [x] Use flood-fill/traversal on elevation to define river branching and ensure connected water bodies.
- [ ] Optionally import DEM height-maps for real-world topography.

## Current Goal
Implement legend overlay + basic zoom/pan + responsive scale bar as foundation for later tasks.
Add proportional road indicators and scale bar overlay

Next steps:
- Test water/shoreline rendering in full city generation pipeline
- Optimize performance for larger canvas sizes
- Add more visual polish and effects
- Consider additional export formats (PNG, SVG, JSON)
- Mobile responsiveness improvements

## Upcoming Enhancements (June 2025)
- [x] Design and implement topography tool (adjustable land/water using noise; support rivers, lakes, bays)
  - [x] Research/select 2D noise library or write custom noise function
  - [x] Implement noise-based land/water classification (thresholding)
  - [x] Add river mode (trace path between edges, mark as water)
  - [x] Add bay mode (lower threshold near one edge)
  - [x] Expose water coverage, river width, noise frequency, and seed as UI sliders/inputs
  - [x] Store topography grid for use by city generation
  - [x] Add "Generate Topography" button and logic
  - [x] Integrate topography with city generation (skip water cells)
  - [x] Render water layer on canvas (blue fill, dark scheme ready)
- [x] Add a visual key/legend for map squares
  - [x] Design legend UI (sidebar or overlay)
  - [x] Add color/symbol explanations for water, land, roads, buildings
  - [x] Render legend in app
- [x] Prevent overlap of squares with models
  - [x] Update model placement logic to check topography grid
  - [x] Ensure no city elements overlap water
- [x] Add proportional visual indicators for roads
  

- [x] Update color scheme to a dark mode
  - [x] Redesign CSS for dark theme
  - [x] (Optional) Add dark/light mode toggle

