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

## Current Goal
Add proportional road indicators and scale bar overlay

Next steps:
- Test all algorithm combinations and parameter ranges
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
- [ ] Add proportional visual indicators for roads
  - [ ] Design road rendering logic (polylines/curves, not just grid)
  - [ ] Draw roads proportional to their type/width
- [ ] Add a scale indicator to the canvas
  - [ ] Design scale bar overlay (like Google Maps)
  - [ ] Make scale respond to zoom/scale changes
- [x] Update color scheme to a dark mode
  - [x] Redesign CSS for dark theme
  - [x] (Optional) Add dark/light mode toggle
- [ ] Improve slider UX for smooth adjustment
  - [ ] Ensure all sliders are smoothly draggable (not just clickable)
  - [ ] Update input types or JS as needed
