# City Generation Tool

A web-based interactive tool for exploring and demonstrating various city generation algorithms. Users can blend multiple algorithms in real-time and customize parameters to create unique urban layouts.

## Features

### 🏗️ **Six Generation Algorithms**
- **Grid Layout**: Regular grid-based cities with customizable block sizes and street widths
- **Poisson Disk Sampling**: Organic layouts with natural spacing between buildings
- **Random Walk**: Emergent city patterns created by walking agents
- **Cellular Automata**: Self-organizing urban structures using CA rules
- **Voronoi Diagram**: District-based cities with tessellated zones
- **Wave Function Collapse**: Constraint-based generation using tile rules

### 🎛️ **Interactive Controls**
- Real-time parameter adjustment for each algorithm
- Algorithm blending with weight controls
- Global settings for scale, randomness, and seeds
- One-click randomization and export functionality

### 🎨 **Visual Features**
- Real-time rendering with detailed building types
- Color-coded districts (residential, commercial, industrial, parks)
- Animated generation with performance statistics
- Modern, responsive UI design

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Local web server (for file loading)

### Installation
1. Clone or download this repository
2. Start a local web server in the project directory:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser

## Usage

### Basic Operation
1. **Select Algorithms**: Check the algorithms you want to use
2. **Adjust Weights**: Use sliders to control how much each algorithm contributes
3. **Tune Parameters**: Modify algorithm-specific settings in the expanded panels
4. **Generate**: Click "Generate" or adjust parameters for real-time updates

### Algorithm Parameters

#### Grid Layout
- **Grid Size**: Size of city blocks (5-50)
- **Street Width**: Width of roads between blocks (1-10)
- **Density**: Building density within blocks (0.1-1.0)

#### Poisson Disk Sampling
- **Min Distance**: Minimum spacing between buildings (10-100)
- **Max Attempts**: Sampling attempts per point (10-100)

#### Random Walk
- **Walker Count**: Number of agents (1-20)
- **Steps**: Steps per walker (50-500)
- **Deposit Chance**: Probability of placing buildings (0.01-1.0)

#### Cellular Automata
- **Generations**: Evolution iterations (1-20)
- **Neighbor Threshold**: Rule threshold for survival (3-8)

#### Voronoi Diagram
- **Seed Points**: Number of district centers (5-100)
- **Buildings per Cell**: Structures per district (1-20)

#### Wave Function Collapse
- **Tile Size**: Size of WFC tiles (5-30)
- **Entropy Threshold**: Collapse sensitivity (1-10)

### Global Controls
- **Overall Scale**: Zoom factor for all elements (0.5-3.0)
- **Randomness**: Amount of positional variance (0-1.0)
- **Seed**: Random seed for reproducible results

## Project Structure

```
city-generation-tool/
├── index.html              # Main application interface
├── styles.css              # UI styling and layout
├── js/
│   ├── main.js             # Application controller
│   ├── renderer.js         # Canvas rendering engine
│   └── algorithms/         # Generation algorithms
│       ├── gridLayout.js
│       ├── poissonDisk.js
│       ├── randomWalk.js
│       ├── cellularAutomata.js
│       ├── voronoi.js
│       └── wfc.js
├── data/
│   └── wfc-tileset.json    # WFC tile definitions
├── plan.md                 # Development roadmap
└── README.md               # This file
```

## Architecture

### Algorithm Interface
Each algorithm implements a standard interface:
```javascript
class AlgorithmName {
    async generate(params) {
        return {
            buildings: [],  // Building objects
            roads: [],      // Road segments
            parks: [],      // Park areas
            water: []       // Water features
        };
    }
}
```

### Data Structures
- **Buildings**: `{x, y, width, height, type, opacity, floors}`
- **Roads**: `{x, y, width, height, direction, type, opacity}`
- **Parks**: `{x, y, width, height, type, opacity, features}`

### Rendering System
The `CityRenderer` class handles:
- Layer-based rendering (water → parks → roads → buildings)
- Building detail generation based on type
- Color schemes and visual effects
- Performance optimization

## Customization

### Adding New Algorithms
1. Create a new file in `js/algorithms/`
2. Implement the standard algorithm interface
3. Add UI controls in `index.html`
4. Register the algorithm in `main.js`

### Modifying WFC Rules
Edit `data/wfc-tileset.json` to:
- Add new building types
- Modify adjacency rules
- Create custom tile sets
- Adjust generation weights

### Styling Changes
Modify `styles.css` to:
- Change color schemes
- Adjust layout proportions
- Add new UI components
- Customize animations

## Performance Notes

- Canvas rendering is optimized for real-time updates
- Algorithm complexity varies: Grid < Poisson < Voronoi < WFC
- Large canvas sizes may impact performance
- Use smaller tile/grid sizes for better responsiveness

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile: Limited (touch controls not optimized)

## Contributing

This tool is designed for extensibility. Areas for contribution:
- New generation algorithms
- Performance optimizations
- Enhanced visual effects
- Mobile responsiveness
- Additional export formats

## License

Open source - feel free to modify and distribute.

## Acknowledgments

Inspired by:
- Procedural generation research
- Urban planning algorithms
- Interactive design tools (Perplexity, Gemini UI patterns)
