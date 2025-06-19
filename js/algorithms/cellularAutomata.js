/**
 * Cellular Automata Algorithm
 * Generates cities using cellular automata rules for emergent urban patterns
 */

class CellularAutomataAlgorithm {
    constructor() {
        this.name = 'Cellular Automata';
        this.description = 'Creates emergent city patterns using cellular automata rules';
    }

    async generate(params) {
        const {
            generations = 5,
            neighborThreshold = 4,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            seed = 12345
        } = params;

        Math.seedrandom(seed);

        const cellSize = 8 * scale;
        const gridWidth = Math.floor(canvasWidth / cellSize);
        const gridHeight = Math.floor(canvasHeight / cellSize);

        // Initialize grid with random values
        let grid = this.initializeGrid(gridWidth, gridHeight);

        // Evolve the grid through generations
        for (let gen = 0; gen < generations; gen++) {
            grid = this.evolveGrid(grid, gridWidth, gridHeight, neighborThreshold);
        }

        // Convert grid to city structures
        return this.gridToStructures(grid, gridWidth, gridHeight, cellSize);
    }

    initializeGrid(gridWidth, gridHeight) {
        const grid = [];
        for (let y = 0; y < gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                const random = Math.seededRandom();
                if (random < 0.4) {
                    grid[y][x] = 'building';
                } else if (random < 0.5) {
                    grid[y][x] = 'road';
                } else if (random < 0.6) {
                    grid[y][x] = 'park';
                } else {
                    grid[y][x] = 'empty';
                }
            }
        }
        return grid;
    }

    evolveGrid(grid, gridWidth, gridHeight, neighborThreshold) {
        const newGrid = [];
        
        for (let y = 0; y < gridHeight; y++) {
            newGrid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                const neighbors = this.countNeighbors(grid, x, y, gridWidth, gridHeight);
                newGrid[y][x] = this.applyRules(grid[y][x], neighbors, neighborThreshold);
            }
        }
        
        return newGrid;
    }

    countNeighbors(grid, x, y, gridWidth, gridHeight) {
        const neighbors = {
            building: 0,
            road: 0,
            park: 0,
            empty: 0
        };

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    const cellType = grid[ny][nx];
                    if (neighbors[cellType] !== undefined) {
                        neighbors[cellType]++;
                    }
                }
            }
        }

        return neighbors;
    }

    applyRules(currentType, neighbors, threshold) {
        const totalNeighbors = Object.values(neighbors).reduce((sum, count) => sum + count, 0);
        
        // Rules for evolution
        switch (currentType) {
            case 'building':
                // Buildings survive if they have enough building neighbors (clustering)
                if (neighbors.building >= 2) return 'building';
                // Convert to road if isolated
                if (neighbors.building === 0) return 'road';
                return 'building';
                
            case 'road':
                // Roads remain roads if they connect buildings
                if (neighbors.building >= 1) return 'road';
                // Convert to park if surrounded by parks
                if (neighbors.park >= 3) return 'park';
                return 'road';
                
            case 'park':
                // Parks remain parks if they have park neighbors
                if (neighbors.park >= 1) return 'park';
                // Convert to building if surrounded by buildings
                if (neighbors.building >= 4) return 'building';
                return 'park';
                
            case 'empty':
                // Empty becomes building if many building neighbors
                if (neighbors.building >= 3) return 'building';
                // Empty becomes park if surrounded by nature
                if (neighbors.park >= 2 && neighbors.building === 0) return 'park';
                return 'empty';
                
            default:
                return 'empty';
        }
    }

    gridToStructures(grid, gridWidth, gridHeight, cellSize) {
        const buildings = [];
        const roads = [];
        const parks = [];

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cellType = grid[y][x];
                const worldX = x * cellSize;
                const worldY = y * cellSize;

                switch (cellType) {
                    case 'building':
                        buildings.push({
                            x: worldX,
                            y: worldY,
                            width: cellSize,
                            height: cellSize,
                            type: this.getBuildingType(x, y, gridWidth, gridHeight),
                            opacity: 1,
                            floors: Math.floor(Math.seededRandom() * 4) + 1
                        });
                        break;
                        
                    case 'road':
                        roads.push({
                            x: worldX,
                            y: worldY,
                            width: cellSize,
                            height: cellSize,
                            direction: this.getRoadDirection(grid, x, y, gridWidth, gridHeight),
                            type: 'cellular',
                            opacity: 1
                        });
                        break;
                        
                    case 'park':
                        parks.push({
                            x: worldX,
                            y: worldY,
                            width: cellSize,
                            height: cellSize,
                            type: 'park',
                            opacity: 1,
                            features: ['grass', 'trees']
                        });
                        break;
                }
            }
        }

        return { buildings, roads, parks, water: [] };
    }

    getBuildingType(x, y, gridWidth, gridHeight) {
        // Building type based on position - center tends to be commercial
        const centerDistance = Math.sqrt(
            Math.pow((x - gridWidth / 2) / gridWidth, 2) + 
            Math.pow((y - gridHeight / 2) / gridHeight, 2)
        );

        if (centerDistance < 0.3) {
            return Math.seededRandom() < 0.6 ? 'commercial' : 'residential';
        } else if (centerDistance > 0.7) {
            return Math.seededRandom() < 0.3 ? 'industrial' : 'residential';
        } else {
            return 'residential';
        }
    }

    getRoadDirection(grid, x, y, gridWidth, gridHeight) {
        // Determine road direction based on neighboring roads
        let horizontalRoads = 0;
        let verticalRoads = 0;

        // Check horizontal neighbors
        if (x > 0 && grid[y][x-1] === 'road') horizontalRoads++;
        if (x < gridWidth - 1 && grid[y][x+1] === 'road') horizontalRoads++;

        // Check vertical neighbors
        if (y > 0 && grid[y-1][x] === 'road') verticalRoads++;
        if (y < gridHeight - 1 && grid[y+1][x] === 'road') verticalRoads++;

        if (horizontalRoads > verticalRoads) return 'horizontal';
        if (verticalRoads > horizontalRoads) return 'vertical';
        return Math.seededRandom() < 0.5 ? 'horizontal' : 'vertical';
    }
}
