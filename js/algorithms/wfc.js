/**
 * Wave Function Collapse Algorithm
 * Generates cities using WFC with constraint-based tile placement
 */

class WFCAlgorithm {
    constructor() {
        this.name = 'Wave Function Collapse';
        this.description = 'Creates cities using Wave Function Collapse with tile-based constraints';
        this.tileset = null;
        this.loadTileset();
    }

    async loadTileset() {
        try {
            const response = await fetch('./data/wfc-tileset.json');
            this.tileset = await response.json();
        } catch (error) {
            console.warn('Could not load WFC tileset, using fallback');
            this.tileset = this.createFallbackTileset();
        }
    }

    createFallbackTileset() {
        return {
            buildingTypes: {
                residential: { colors: ['#8FBC8F'], density: 'medium', height: [1, 3] },
                commercial: { colors: ['#4169E1'], density: 'high', height: [2, 5] },
                industrial: { colors: ['#696969'], density: 'low', height: [1, 2] },
                park: { colors: ['#228B22'], density: 'none', height: [0, 1] },
                road: { colors: ['#696969'], density: 'none', height: [0, 0] },
                empty: { colors: ['#F5F5DC'], density: 'none', height: [0, 0] }
            },
            tiles: [
                { id: 0, name: 'residential', type: 'residential', weight: 0.3 },
                { id: 1, name: 'commercial', type: 'commercial', weight: 0.2 },
                { id: 2, name: 'industrial', type: 'industrial', weight: 0.1 },
                { id: 3, name: 'park', type: 'park', weight: 0.15 },
                { id: 4, name: 'road_h', type: 'road', weight: 0.1 },
                { id: 5, name: 'road_v', type: 'road', weight: 0.1 },
                { id: 6, name: 'empty', type: 'empty', weight: 0.05 }
            ],
            adjacencyRules: {
                matrix: {
                    residential: { residential: 1.0, commercial: 0.8, industrial: 0.2, park: 1.0, road: 1.0, empty: 0.7 },
                    commercial: { residential: 0.8, commercial: 1.0, industrial: 0.3, park: 0.7, road: 1.0, empty: 0.5 },
                    industrial: { residential: 0.2, commercial: 0.3, industrial: 1.0, park: 0.3, road: 1.0, empty: 0.9 },
                    park: { residential: 1.0, commercial: 0.7, industrial: 0.3, park: 1.0, road: 0.8, empty: 0.8 },
                    road: { residential: 1.0, commercial: 1.0, industrial: 1.0, park: 0.8, road: 1.0, empty: 0.9 },
                    empty: { residential: 0.7, commercial: 0.5, industrial: 0.9, park: 0.8, road: 0.9, empty: 1.0 }
                }
            }
        };
    }

    async generate(params) {
        const {
            tileSize = 10,
            entropyThreshold = 3,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            seed = 12345
        } = params;

        Math.seedrandom(seed);

        if (!this.tileset) {
            this.tileset = this.createFallbackTileset();
        }

        const actualTileSize = tileSize * scale;
        const gridWidth = Math.floor(canvasWidth / actualTileSize);
        const gridHeight = Math.floor(canvasHeight / actualTileSize);

        // Initialize WFC grid
        const grid = this.initializeWFCGrid(gridWidth, gridHeight);

        // Run WFC algorithm
        this.collapseWaveFunction(grid, gridWidth, gridHeight, entropyThreshold);

        // Convert WFC result to city structures
        return this.wfcToStructures(grid, gridWidth, gridHeight, actualTileSize);
    }

    initializeWFCGrid(gridWidth, gridHeight) {
        const grid = [];
        const allTileIds = this.tileset.tiles.map(tile => tile.id);

        for (let y = 0; y < gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                grid[y][x] = {
                    collapsed: false,
                    possibilities: [...allTileIds],
                    entropy: allTileIds.length
                };
            }
        }

        return grid;
    }

    collapseWaveFunction(grid, gridWidth, gridHeight, entropyThreshold) {
        const maxIterations = gridWidth * gridHeight * 2;
        let iterations = 0;

        while (iterations < maxIterations) {
            // Find cell with lowest entropy
            const lowestEntropyCell = this.findLowestEntropyCell(grid, gridWidth, gridHeight);
            
            if (!lowestEntropyCell || lowestEntropyCell.entropy === 0) {
                break; // No more cells to collapse or contradiction
            }

            if (lowestEntropyCell.entropy <= entropyThreshold) {
                // Collapse the cell
                this.collapseCell(grid, lowestEntropyCell.x, lowestEntropyCell.y);
                
                // Propagate constraints
                this.propagateConstraints(grid, lowestEntropyCell.x, lowestEntropyCell.y, gridWidth, gridHeight);
            } else {
                // If entropy is too high, pick a random uncollapsed cell
                const randomCell = this.findRandomUncollapedCell(grid, gridWidth, gridHeight);
                if (randomCell) {
                    this.collapseCell(grid, randomCell.x, randomCell.y);
                    this.propagateConstraints(grid, randomCell.x, randomCell.y, gridWidth, gridHeight);
                }
            }

            iterations++;
        }
    }

    findLowestEntropyCell(grid, gridWidth, gridHeight) {
        let lowestEntropy = Infinity;
        let candidates = [];

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = grid[y][x];
                if (!cell.collapsed && cell.entropy > 0) {
                    if (cell.entropy < lowestEntropy) {
                        lowestEntropy = cell.entropy;
                        candidates = [{ x, y, entropy: cell.entropy }];
                    } else if (cell.entropy === lowestEntropy) {
                        candidates.push({ x, y, entropy: cell.entropy });
                    }
                }
            }
        }

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.seededRandom() * candidates.length)];
    }

    findRandomUncollapedCell(grid, gridWidth, gridHeight) {
        const uncollapsed = [];
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (!grid[y][x].collapsed) {
                    uncollapsed.push({ x, y });
                }
            }
        }

        if (uncollapsed.length === 0) return null;
        return uncollapsed[Math.floor(Math.seededRandom() * uncollapsed.length)];
    }

    collapseCell(grid, x, y) {
        const cell = grid[y][x];
        if (cell.collapsed || cell.possibilities.length === 0) return;

        // Weight the possibilities by tile weights
        const weightedPossibilities = [];
        cell.possibilities.forEach(tileId => {
            const tile = this.tileset.tiles.find(t => t.id === tileId);
            const weight = tile ? tile.weight : 0.1;
            for (let i = 0; i < weight * 100; i++) {
                weightedPossibilities.push(tileId);
            }
        });

        // Choose random tile based on weights
        const chosenTileId = weightedPossibilities[Math.floor(Math.seededRandom() * weightedPossibilities.length)];
        
        cell.collapsed = true;
        cell.possibilities = [chosenTileId];
        cell.entropy = 0;
        cell.tileId = chosenTileId;
    }

    propagateConstraints(grid, startX, startY, gridWidth, gridHeight) {
        const queue = [{ x: startX, y: startY }];
        const visited = new Set();

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);

            const neighbors = [
                { x: x + 1, y, direction: 'east' },
                { x: x - 1, y, direction: 'west' },
                { x, y: y + 1, direction: 'south' },
                { x, y: y - 1, direction: 'north' }
            ];

            neighbors.forEach(neighbor => {
                if (neighbor.x >= 0 && neighbor.x < gridWidth && 
                    neighbor.y >= 0 && neighbor.y < gridHeight) {
                    
                    const neighborCell = grid[neighbor.y][neighbor.x];
                    if (!neighborCell.collapsed) {
                        const validPossibilities = this.filterPossibilities(
                            neighborCell.possibilities,
                            grid[y][x].tileId,
                            neighbor.direction
                        );

                        if (validPossibilities.length !== neighborCell.possibilities.length) {
                            neighborCell.possibilities = validPossibilities;
                            neighborCell.entropy = validPossibilities.length;
                            queue.push({ x: neighbor.x, y: neighbor.y });
                        }
                    }
                }
            });
        }
    }

    filterPossibilities(possibilities, neighborTileId, direction) {
        if (!neighborTileId && neighborTileId !== 0) return possibilities;

        const neighborTile = this.tileset.tiles.find(t => t.id === neighborTileId);
        if (!neighborTile) return possibilities;

        return possibilities.filter(tileId => {
            const tile = this.tileset.tiles.find(t => t.id === tileId);
            if (!tile) return false;

            // Check adjacency rules
            const neighborType = neighborTile.type;
            const currentType = tile.type;
            
            const adjacencyScore = this.tileset.adjacencyRules.matrix[currentType]?.[neighborType];
            return adjacencyScore && adjacencyScore > 0.3; // Threshold for compatibility
        });
    }

    wfcToStructures(grid, gridWidth, gridHeight, tileSize) {
        const buildings = [];
        const roads = [];
        const parks = [];

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = grid[y][x];
                if (!cell.collapsed) continue;

                const tile = this.tileset.tiles.find(t => t.id === cell.tileId);
                if (!tile) continue;

                const worldX = x * tileSize;
                const worldY = y * tileSize;

                switch (tile.type) {
                    case 'residential':
                    case 'commercial':
                    case 'industrial':
                        buildings.push({
                            x: worldX,
                            y: worldY,
                            width: tileSize,
                            height: tileSize,
                            type: tile.type,
                            opacity: 1,
                            floors: this.getBuildingHeight(tile.type),
                            wfcTile: tile.id
                        });
                        break;

                    case 'road':
                        roads.push({
                            x: worldX,
                            y: worldY,
                            width: tileSize,
                            height: tileSize,
                            direction: tile.name.includes('_h') ? 'horizontal' : 'vertical',
                            type: 'wfc',
                            opacity: 1
                        });
                        break;

                    case 'park':
                        parks.push({
                            x: worldX,
                            y: worldY,
                            width: tileSize,
                            height: tileSize,
                            type: 'park',
                            opacity: 1,
                            features: ['wfc_generated']
                        });
                        break;
                }
            }
        }

        return { buildings, roads, parks, water: [] };
    }

    getBuildingHeight(buildingType) {
        const typeInfo = this.tileset.buildingTypes[buildingType];
        if (!typeInfo || !typeInfo.height) return 1;
        
        const [min, max] = typeInfo.height;
        return Math.floor(Math.seededRandom() * (max - min + 1)) + min;
    }
}
