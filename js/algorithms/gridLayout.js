/**
 * Grid Layout Algorithm
 * Generates cities using a regular grid system with blocks and streets
 */

class GridLayoutAlgorithm {
    constructor() {
        this.name = 'Grid Layout';
        this.description = 'Creates cities using a regular grid pattern with customizable block sizes and street widths';
    }

    async generate(params) {
        const {
            gridSize = 20,
            streetWidth = 2,
            density = 0.7,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            randomness = 0.5,
            seed = 12345
        } = params;

        // Seed the random number generator for consistent results
        Math.seedrandom(seed);

        const buildings = [];
        const roads = [];
        const parks = [];

        const blockSize = gridSize * scale;
        const roadWidth = streetWidth * scale;
        const totalBlockSize = blockSize + roadWidth;

        const gridCols = Math.floor(canvasWidth / totalBlockSize);
        const gridRows = Math.floor(canvasHeight / totalBlockSize);

        // Generate road network first
        this.generateRoadNetwork(roads, gridCols, gridRows, totalBlockSize, blockSize, roadWidth, canvasWidth, canvasHeight);

        // Generate buildings and parks in each block
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const blockX = col * totalBlockSize;
                const blockY = row * totalBlockSize;

                // Apply some randomness to block positions
                const offsetX = (Math.seededRandom() - 0.5) * randomness * roadWidth;
                const offsetY = (Math.seededRandom() - 0.5) * randomness * roadWidth;

                const adjustedX = blockX + offsetX;
                const adjustedY = blockY + offsetY;

                // Decide what to put in this block
                const blockType = this.determineBlockType(row, col, gridRows, gridCols, density);

                if (blockType === 'park') {
                    parks.push(this.createPark(adjustedX, adjustedY, blockSize, blockSize));
                } else if (blockType === 'buildings') {
                    this.generateBuildingsInBlock(buildings, adjustedX, adjustedY, blockSize, density, randomness);
                }
            }
        }

        return {
            buildings,
            roads,
            parks,
            water: [] // Grid layout doesn't typically include water features
        };
    }

    generateRoadNetwork(roads, gridCols, gridRows, totalBlockSize, blockSize, roadWidth, canvasWidth, canvasHeight) {
        // Horizontal roads
        for (let row = 0; row <= gridRows; row++) {
            const y = row * totalBlockSize - roadWidth / 2;
            if (y >= 0 && y + roadWidth <= canvasHeight) {
                roads.push({
                    x: 0,
                    y: y,
                    width: canvasWidth,
                    height: roadWidth,
                    direction: 'horizontal',
                    type: 'main',
                    opacity: 1
                });
            }
        }

        // Vertical roads
        for (let col = 0; col <= gridCols; col++) {
            const x = col * totalBlockSize - roadWidth / 2;
            if (x >= 0 && x + roadWidth <= canvasWidth) {
                roads.push({
                    x: x,
                    y: 0,
                    width: roadWidth,
                    height: canvasHeight,
                    direction: 'vertical',
                    type: 'main',
                    opacity: 1
                });
            }
        }
    }

    determineBlockType(row, col, gridRows, gridCols, density) {
        // Create some variety in block types based on position
        const centerDistance = Math.sqrt(
            Math.pow((col - gridCols / 2) / gridCols, 2) + 
            Math.pow((row - gridRows / 2) / gridRows, 2)
        );

        // More parks on the edges and at regular intervals
        if (centerDistance > 0.7 || (row + col) % 7 === 0) {
            return Math.seededRandom() < 0.3 ? 'park' : 'buildings';
        }

        // More dense building areas in the center
        return Math.seededRandom() < density ? 'buildings' : 'empty';
    }

    generateBuildingsInBlock(buildings, blockX, blockY, blockSize, density, randomness) {
        const margin = 2;
        const availableWidth = blockSize - 2 * margin;
        const availableHeight = blockSize - 2 * margin;

        // Determine building layout within the block
        const layoutType = Math.seededRandom();

        if (layoutType < 0.4) {
            // Single large building
            this.createSingleBuilding(buildings, blockX + margin, blockY + margin, availableWidth, availableHeight, randomness);
        } else if (layoutType < 0.7) {
            // Multiple smaller buildings
            this.createMultipleBuildings(buildings, blockX + margin, blockY + margin, availableWidth, availableHeight, density, randomness);
        } else {
            // Mixed development
            this.createMixedDevelopment(buildings, blockX + margin, blockY + margin, availableWidth, availableHeight, randomness);
        }
    }

    createSingleBuilding(buildings, x, y, width, height, randomness) {
        const buildingType = this.getBuildingType('commercial'); // Large buildings tend to be commercial
        
        // Add some variation to the building size
        const widthVar = width * (1 - randomness * 0.3);
        const heightVar = height * (1 - randomness * 0.3);
        
        buildings.push({
            x: x + (width - widthVar) / 2,
            y: y + (height - heightVar) / 2,
            width: widthVar,
            height: heightVar,
            type: buildingType,
            opacity: 1,
            floors: Math.floor(Math.seededRandom() * 8) + 2
        });
    }

    createMultipleBuildings(buildings, x, y, width, height, density, randomness) {
        const buildingCount = Math.floor(density * 6) + 2; // 2-8 buildings
        const buildingsPerRow = Math.ceil(Math.sqrt(buildingCount));
        const buildingWidth = width / buildingsPerRow;
        const buildingHeight = height / Math.ceil(buildingCount / buildingsPerRow);

        for (let i = 0; i < buildingCount; i++) {
            const row = Math.floor(i / buildingsPerRow);
            const col = i % buildingsPerRow;
            
            const buildingX = x + col * buildingWidth;
            const buildingY = y + row * buildingHeight;
            
            // Add spacing between buildings
            const spacing = Math.min(buildingWidth, buildingHeight) * 0.1;
            const actualWidth = buildingWidth - spacing;
            const actualHeight = buildingHeight - spacing;
            
            if (actualWidth > 5 && actualHeight > 5) {
                // Add randomness to building position
                const offsetX = (Math.seededRandom() - 0.5) * randomness * spacing;
                const offsetY = (Math.seededRandom() - 0.5) * randomness * spacing;
                
                buildings.push({
                    x: buildingX + spacing / 2 + offsetX,
                    y: buildingY + spacing / 2 + offsetY,
                    width: actualWidth,
                    height: actualHeight,
                    type: this.getBuildingType('residential'),
                    opacity: 1,
                    floors: Math.floor(Math.seededRandom() * 4) + 1
                });
            }
        }
    }

    createMixedDevelopment(buildings, x, y, width, height, randomness) {
        // Create a mix of one large building and several smaller ones
        const largeBuilding = {
            x: x,
            y: y,
            width: width * 0.6,
            height: height * 0.6,
            type: this.getBuildingType('commercial'),
            opacity: 1,
            floors: Math.floor(Math.seededRandom() * 6) + 3
        };
        buildings.push(largeBuilding);

        // Add smaller buildings around it
        const smallBuildingSize = Math.min(width, height) * 0.2;
        const positions = [
            { x: x + width * 0.7, y: y, width: width * 0.3, height: smallBuildingSize },
            { x: x + width * 0.7, y: y + height * 0.7, width: width * 0.3, height: width * 0.3 },
            { x: x, y: y + height * 0.7, width: smallBuildingSize, height: height * 0.3 }
        ];

        positions.forEach(pos => {
            if (pos.width > 5 && pos.height > 5) {
                const offsetX = (Math.seededRandom() - 0.5) * randomness * 5;
                const offsetY = (Math.seededRandom() - 0.5) * randomness * 5;
                
                buildings.push({
                    x: pos.x + offsetX,
                    y: pos.y + offsetY,
                    width: pos.width,
                    height: pos.height,
                    type: this.getBuildingType('residential'),
                    opacity: 1,
                    floors: Math.floor(Math.seededRandom() * 3) + 1
                });
            }
        });
    }

    createPark(x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height,
            type: 'park',
            opacity: 1,
            features: ['trees', 'paths', 'grass']
        };
    }

    getBuildingType(preference = null) {
        const types = ['residential', 'commercial', 'industrial'];
        
        if (preference && types.includes(preference)) {
            // 70% chance of getting the preferred type
            return Math.seededRandom() < 0.7 ? preference : types[Math.floor(Math.seededRandom() * types.length)];
        }
        
        // Default distribution
        const random = Math.seededRandom();
        if (random < 0.5) return 'residential';
        if (random < 0.8) return 'commercial';
        return 'industrial';
    }

    // Utility method to validate and adjust parameters
    validateParams(params) {
        const validated = { ...params };
        
        validated.gridSize = Math.max(5, Math.min(50, validated.gridSize || 20));
        validated.streetWidth = Math.max(1, Math.min(10, validated.streetWidth || 2));
        validated.density = Math.max(0.1, Math.min(1, validated.density || 0.7));
        
        return validated;
    }
}
