/**
 * Voronoi Diagram Algorithm
 * Generates cities using Voronoi tessellation for district-based layouts
 */

class VoronoiAlgorithm {
    constructor() {
        this.name = 'Voronoi Diagram';
        this.description = 'Creates district-based city layouts using Voronoi tessellation';
    }

    async generate(params) {
        const {
            seedPoints = 25,
            buildingsPerCell = 5,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            seed = 12345
        } = params;

        Math.seedrandom(seed);

        const buildings = [];
        const roads = [];
        const parks = [];

        // Generate seed points
        const seeds = this.generateSeedPoints(seedPoints, canvasWidth, canvasHeight);

        // Create Voronoi cells
        const cells = this.createVoronoiCells(seeds, canvasWidth, canvasHeight);

        // Generate structures for each cell
        cells.forEach(cell => {
            this.populateCell(cell, buildings, roads, parks, buildingsPerCell, scale);
        });

        // Connect districts with roads
        this.connectDistricts(seeds, roads, canvasWidth, canvasHeight, scale);

        return { buildings, roads, parks, water: [] };
    }

    generateSeedPoints(count, width, height) {
        const seeds = [];
        for (let i = 0; i < count; i++) {
            seeds.push({
                x: Math.seededRandom() * width,
                y: Math.seededRandom() * height,
                type: this.getDistrictType(),
                id: i
            });
        }
        return seeds;
    }

    getDistrictType() {
        const random = Math.seededRandom();
        if (random < 0.4) return 'residential';
        if (random < 0.6) return 'commercial';
        if (random < 0.8) return 'industrial';
        return 'mixed';
    }

    createVoronoiCells(seeds, width, height) {
        const cells = [];
        const sampleCount = 20; // Samples per dimension for approximating cell boundaries

        seeds.forEach(seed => {
            const cell = {
                seed: seed,
                points: [],
                bounds: { minX: width, maxX: 0, minY: height, maxY: 0 }
            };

            // Sample points within the Voronoi cell
            for (let x = 0; x < width; x += width / sampleCount) {
                for (let y = 0; y < height; y += height / sampleCount) {
                    const closestSeed = this.findClosestSeed({ x, y }, seeds);
                    if (closestSeed.id === seed.id) {
                        cell.points.push({ x, y });
                        cell.bounds.minX = Math.min(cell.bounds.minX, x);
                        cell.bounds.maxX = Math.max(cell.bounds.maxX, x);
                        cell.bounds.minY = Math.min(cell.bounds.minY, y);
                        cell.bounds.maxY = Math.max(cell.bounds.maxY, y);
                    }
                }
            }

            cells.push(cell);
        });

        return cells;
    }

    findClosestSeed(point, seeds) {
        let closest = seeds[0];
        let minDistance = this.distance(point, closest);

        for (let i = 1; i < seeds.length; i++) {
            const dist = this.distance(point, seeds[i]);
            if (dist < minDistance) {
                minDistance = dist;
                closest = seeds[i];
            }
        }

        return closest;
    }

    distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    populateCell(cell, buildings, roads, parks, buildingsPerCell, scale) {
        const { seed, bounds } = cell;
        const cellWidth = bounds.maxX - bounds.minX;
        const cellHeight = bounds.maxY - bounds.minY;

        if (cellWidth < 20 || cellHeight < 20) return; // Skip tiny cells

        // Add a park in the center of some cells
        if (Math.seededRandom() < 0.3) {
            const parkSize = Math.min(cellWidth, cellHeight) * 0.4;
            parks.push({
                x: seed.x - parkSize / 2,
                y: seed.y - parkSize / 2,
                width: parkSize,
                height: parkSize,
                type: 'park',
                opacity: 1,
                features: ['trees', 'paths', 'center']
            });
        }

        // Generate buildings within the cell
        const actualBuildingCount = Math.floor(buildingsPerCell * (1 + Math.seededRandom() * 0.5));
        
        for (let i = 0; i < actualBuildingCount; i++) {
            // Place buildings within cell bounds, avoiding the center
            let buildingX, buildingY;
            let attempts = 0;
            
            do {
                const angle = Math.seededRandom() * 2 * Math.PI;
                const radius = (Math.seededRandom() * 0.4 + 0.3) * Math.min(cellWidth, cellHeight) / 2;
                
                buildingX = seed.x + Math.cos(angle) * radius;
                buildingY = seed.y + Math.sin(angle) * radius;
                attempts++;
            } while (attempts < 10 && (
                buildingX < bounds.minX + 10 || buildingX > bounds.maxX - 10 ||
                buildingY < bounds.minY + 10 || buildingY > bounds.maxY - 10
            ));

            if (attempts < 10) {
                const buildingSize = this.getBuildingSize(seed.type, scale);
                buildings.push({
                    x: buildingX - buildingSize.width / 2,
                    y: buildingY - buildingSize.height / 2,
                    width: buildingSize.width,
                    height: buildingSize.height,
                    type: this.getBuildingTypeForDistrict(seed.type),
                    opacity: 1,
                    floors: Math.floor(Math.seededRandom() * 6) + 1,
                    district: seed.id
                });
            }
        }

        // Add internal roads within the cell
        this.addInternalRoads(cell, roads, scale);
    }

    getBuildingSize(districtType, scale) {
        let baseSize;
        
        switch (districtType) {
            case 'commercial':
                baseSize = 15 + Math.seededRandom() * 20;
                break;
            case 'industrial':
                baseSize = 20 + Math.seededRandom() * 25;
                break;
            case 'residential':
                baseSize = 8 + Math.seededRandom() * 12;
                break;
            default:
                baseSize = 10 + Math.seededRandom() * 15;
        }

        return {
            width: baseSize * scale,
            height: baseSize * scale * (0.8 + Math.seededRandom() * 0.4)
        };
    }

    getBuildingTypeForDistrict(districtType) {
        if (districtType === 'mixed') {
            const random = Math.seededRandom();
            if (random < 0.5) return 'residential';
            if (random < 0.8) return 'commercial';
            return 'industrial';
        }
        return districtType;
    }

    addInternalRoads(cell, roads, scale) {
        const { seed, bounds } = cell;
        const roadWidth = 4 * scale;

        // Add a few internal roads connecting to the center
        const roadCount = Math.floor(Math.seededRandom() * 3) + 1;
        
        for (let i = 0; i < roadCount; i++) {
            const angle = (i / roadCount) * 2 * Math.PI + Math.seededRandom() * 0.5;
            const length = Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.4;
            
            const endX = seed.x + Math.cos(angle) * length;
            const endY = seed.y + Math.sin(angle) * length;
            
            const isHorizontal = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle));
            
            roads.push({
                x: Math.min(seed.x, endX) - roadWidth / 2,
                y: Math.min(seed.y, endY) - roadWidth / 2,
                width: isHorizontal ? Math.abs(endX - seed.x) + roadWidth : roadWidth,
                height: isHorizontal ? roadWidth : Math.abs(endY - seed.y) + roadWidth,
                direction: isHorizontal ? 'horizontal' : 'vertical',
                type: 'district_internal',
                opacity: 0.8
            });
        }
    }

    connectDistricts(seeds, roads, canvasWidth, canvasHeight, scale) {
        const roadWidth = 6 * scale;
        
        // Create a minimal spanning tree to connect all districts
        const connections = this.createDistrictMST(seeds);
        
        connections.forEach(connection => {
            const start = seeds[connection.from];
            const end = seeds[connection.to];
            
            // Create L-shaped connection (horizontal then vertical)
            const midX = start.x + (end.x - start.x) * 0.5;
            
            // Horizontal segment
            roads.push({
                x: Math.min(start.x, midX),
                y: start.y - roadWidth / 2,
                width: Math.abs(midX - start.x),
                height: roadWidth,
                direction: 'horizontal',
                type: 'district_connector',
                opacity: 1
            });
            
            // Vertical segment
            roads.push({
                x: midX - roadWidth / 2,
                y: Math.min(start.y, end.y),
                width: roadWidth,
                height: Math.abs(end.y - start.y),
                direction: 'vertical',
                type: 'district_connector',
                opacity: 1
            });
            
            // Final horizontal segment
            roads.push({
                x: Math.min(midX, end.x),
                y: end.y - roadWidth / 2,
                width: Math.abs(end.x - midX),
                height: roadWidth,
                direction: 'horizontal',
                type: 'district_connector',
                opacity: 1
            });
        });
    }

    createDistrictMST(seeds) {
        if (seeds.length === 0) return [];
        
        const connections = [];
        const connected = new Set([0]);
        
        while (connected.size < seeds.length) {
            let minDistance = Infinity;
            let bestConnection = null;
            
            for (const connectedIndex of connected) {
                for (let i = 0; i < seeds.length; i++) {
                    if (!connected.has(i)) {
                        const distance = this.distance(seeds[connectedIndex], seeds[i]);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestConnection = { from: connectedIndex, to: i };
                        }
                    }
                }
            }
            
            if (bestConnection) {
                connections.push(bestConnection);
                connected.add(bestConnection.to);
            }
        }
        
        return connections;
    }
}
