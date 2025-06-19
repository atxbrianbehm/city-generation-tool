/**
 * Poisson Disk Sampling Algorithm
 * Generates cities using Poisson disk sampling for natural, organic layouts
 */

class PoissonDiskAlgorithm {
    constructor() {
        this.name = 'Poisson Disk Sampling';
        this.description = 'Creates organic city layouts using Poisson disk sampling to ensure minimum distances between buildings';
    }

    async generate(params) {
        const {
            minDistance = 30,
            maxAttempts = 30,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            randomness = 0.5,
            seed = 12345
        } = params;

        Math.seedrandom(seed);

        const buildings = [];
        const roads = [];
        const parks = [];

        const points = this.poissonDiskSampling(canvasWidth, canvasHeight, minDistance * scale, maxAttempts);

        // Convert points to buildings
        points.forEach(point => {
            const buildingSize = (10 + Math.seededRandom() * 20) * scale;
            const buildingType = this.getBuildingType();
            
            buildings.push({
                x: point.x - buildingSize / 2,
                y: point.y - buildingSize / 2,
                width: buildingSize,
                height: buildingSize,
                type: buildingType,
                opacity: 1,
                floors: Math.floor(Math.seededRandom() * 5) + 1
            });
        });

        // Generate organic road network connecting buildings
        this.generateOrganicRoads(roads, points, canvasWidth, canvasHeight, scale);

        // Add some parks in open areas
        this.generateParks(parks, points, canvasWidth, canvasHeight, minDistance * scale);

        return { buildings, roads, parks, water: [] };
    }

    poissonDiskSampling(width, height, minDistance, maxAttempts) {
        const points = [];
        const grid = [];
        const cellSize = minDistance / Math.sqrt(2);
        const gridWidth = Math.ceil(width / cellSize);
        const gridHeight = Math.ceil(height / cellSize);

        // Initialize grid
        for (let i = 0; i < gridWidth * gridHeight; i++) {
            grid[i] = null;
        }

        // Start with initial random point
        const initialPoint = {
            x: Math.seededRandom() * width,
            y: Math.seededRandom() * height
        };
        
        points.push(initialPoint);
        const gridIndex = Math.floor(initialPoint.x / cellSize) + Math.floor(initialPoint.y / cellSize) * gridWidth;
        grid[gridIndex] = points.length - 1;

        const activeList = [0];

        while (activeList.length > 0) {
            const randomIndex = Math.floor(Math.seededRandom() * activeList.length);
            const currentPointIndex = activeList[randomIndex];
            const currentPoint = points[currentPointIndex];
            let found = false;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const angle = Math.seededRandom() * 2 * Math.PI;
                const radius = minDistance + Math.seededRandom() * minDistance;
                
                const newPoint = {
                    x: currentPoint.x + Math.cos(angle) * radius,
                    y: currentPoint.y + Math.sin(angle) * radius
                };

                if (newPoint.x >= 0 && newPoint.x < width && newPoint.y >= 0 && newPoint.y < height) {
                    if (this.isValidPoint(newPoint, points, grid, minDistance, cellSize, gridWidth, gridHeight)) {
                        points.push(newPoint);
                        const newGridIndex = Math.floor(newPoint.x / cellSize) + Math.floor(newPoint.y / cellSize) * gridWidth;
                        grid[newGridIndex] = points.length - 1;
                        activeList.push(points.length - 1);
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                activeList.splice(randomIndex, 1);
            }
        }

        return points;
    }

    isValidPoint(point, points, grid, minDistance, cellSize, gridWidth, gridHeight) {
        const gridX = Math.floor(point.x / cellSize);
        const gridY = Math.floor(point.y / cellSize);

        for (let x = Math.max(0, gridX - 2); x <= Math.min(gridWidth - 1, gridX + 2); x++) {
            for (let y = Math.max(0, gridY - 2); y <= Math.min(gridHeight - 1, gridY + 2); y++) {
                const pointIndex = grid[x + y * gridWidth];
                if (pointIndex !== null) {
                    const existingPoint = points[pointIndex];
                    const distance = Math.sqrt(
                        Math.pow(point.x - existingPoint.x, 2) + 
                        Math.pow(point.y - existingPoint.y, 2)
                    );
                    if (distance < minDistance) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    generateOrganicRoads(roads, points, canvasWidth, canvasHeight, scale) {
        // Create a minimal spanning tree to connect buildings
        const connections = this.createMST(points);
        
        connections.forEach(connection => {
            const start = points[connection.from];
            const end = points[connection.to];
            
            roads.push({
                x: Math.min(start.x, end.x),
                y: Math.min(start.y, end.y) - 2,
                width: Math.abs(end.x - start.x) || 4,
                height: Math.abs(end.y - start.y) || 4,
                direction: Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? 'horizontal' : 'vertical',
                type: 'organic',
                opacity: 1
            });
        });
    }

    createMST(points) {
        if (points.length === 0) return [];
        
        const connections = [];
        const connected = new Set([0]);
        
        while (connected.size < points.length) {
            let minDistance = Infinity;
            let bestConnection = null;
            
            for (const connectedIndex of connected) {
                for (let i = 0; i < points.length; i++) {
                    if (!connected.has(i)) {
                        const distance = Math.sqrt(
                            Math.pow(points[connectedIndex].x - points[i].x, 2) + 
                            Math.pow(points[connectedIndex].y - points[i].y, 2)
                        );
                        
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

    generateParks(parks, points, canvasWidth, canvasHeight, minDistance) {
        // Find areas with low point density for parks
        const parkCandidates = [];
        const gridSize = minDistance;
        
        for (let x = gridSize; x < canvasWidth - gridSize; x += gridSize * 2) {
            for (let y = gridSize; y < canvasHeight - gridSize; y += gridSize * 2) {
                const nearbyPoints = points.filter(point => {
                    const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                    return distance < gridSize * 1.5;
                });
                
                if (nearbyPoints.length === 0) {
                    parkCandidates.push({ x: x - gridSize/2, y: y - gridSize/2 });
                }
            }
        }
        
        // Select random park locations
        const parkCount = Math.min(5, Math.floor(parkCandidates.length * 0.3));
        for (let i = 0; i < parkCount; i++) {
            const parkIndex = Math.floor(Math.seededRandom() * parkCandidates.length);
            const park = parkCandidates[parkIndex];
            
            parks.push({
                x: park.x,
                y: park.y,
                width: gridSize,
                height: gridSize,
                type: 'park',
                opacity: 1,
                features: ['trees', 'paths']
            });
            
            parkCandidates.splice(parkIndex, 1);
        }
    }

    getBuildingType() {
        const random = Math.seededRandom();
        if (random < 0.6) return 'residential';
        if (random < 0.8) return 'commercial';
        return 'industrial';
    }
}
