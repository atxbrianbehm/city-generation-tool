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
Design topography tool with dynamic water features and visual key

Next steps:
- Test all algorithm combinations and parameter ranges
- Optimize performance for larger canvas sizes
- Add more visual polish and effects
- Consider additional export formats (PNG, SVG, JSON)
- Mobile responsiveness improvements

## Upcoming Enhancements (June 2025)
- [ ] Design and implement topography tool (adjustable land/water using noise; support rivers, lakes, bays)
- [ ] Integrate topography with generation algorithms to prevent overlap
- [ ] Add visual key / legend for map squares
- [ ] Draw proportional road indicators
- [ ] Add scale indicator overlay on canvas
- [ ] Dark mode color scheme
- [ ] Improve slider UX (drag smoothing)
