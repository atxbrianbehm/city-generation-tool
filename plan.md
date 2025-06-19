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
    - [ ] Draft minimal tile-set JSON and adjacency matrix for WFC
- [ ] Design user interface for algorithm selection and blending
  - [ ] Sidebar for algorithm selection (see Perplexity/Gemini layouts)
  - [ ] Sliders and inputs for algorithm parameters
  - [ ] Blend sliders for algorithm weighting
  - [ ] Export and statistics panel
- [ ] Implement controls for density, scale, randomization, and custom seeds
- [ ] Develop rendering logic for parcels and buildings (support squares, polygons, topography overlays)
- [ ] Integrate algorithms with UI controls and real-time updates
- [ ] Test blending and control functionality (side-by-side comparison, real-time feedback)
- [ ] Polish UI/UX and provide clear feedback (color coding, legends, tooltips)
- [ ] Document code and write README for extensibility
- [ ] Create project folder and initialize git repository
- [ ] Copy current plan.md into project folder
- [ ] Create Windsurf rules file for plan synchronization

## Current Goal
Set up project folder, git, and synchronize plan files
