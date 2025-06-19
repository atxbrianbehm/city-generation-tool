/**
 * Random Walk Algorithm
 * Generates cities using random walk patterns to create organic, sprawling layouts
 */

class RandomWalkAlgorithm {
    constructor() {
        this.name = 'Random Walk';
        this.description = 'Creates organic city layouts using random walk agents that deposit buildings and roads';
    }

    async generate(params) {
        const {
            walkerCount = 5,
            steps = 200,
            depositChance = 0.3,
            canvasWidth = 800,
            canvasHeight = 600,
            scale = 1,
            seed = 12345
        } = params;

        Math.seedrandom(seed);

        const buildings = [];
        const roads = [];
        const parks = [];
        const depositedPoints = [];

        // Initialize walkers
        const walkers = [];
        for (let i = 0; i < walkerCount; i++) {
            walkers.push({
                x: canvasWidth / 2 + (Math.seededRandom() - 0.5) * 100,
                y: canvasHeight / 2 + (Math.seededRandom() - 0.5) * 100,
                direction: Math.seededRandom() * 2 * Math.PI,
                type: this.getWalkerType()
            });
        }

        // Perform random walks
        for (let step = 0; step < steps; step++) {
            walkers.forEach((walker, index) => {
                this.updateWalker(walker, canvasWidth, canvasHeight);
                
                if (Math.seededRandom() < depositChance) {
                    depositedPoints.push({
                        x: walker.x,
                        y: walker.y,
                        type: walker.type,
                        step: step
                    });
                }
            });
        }

        // Convert deposited points to buildings and infrastructure
        this.convertPointsToStructures(depositedPoints, buildings, roads, parks, scale);

        return { buildings, roads, parks, water: [] };
    }

    getWalkerType() {
        const random = Math.seededRandom();
        if (random < 0.3) return 'residential';
        if (random < 0.5) return 'commercial';
        if (random < 0.7) return 'road';
        return 'park';
    }

    updateWalker(walker, canvasWidth, canvasHeight) {
        // Random direction change
        walker.direction += (Math.seededRandom() - 0.5) * 0.5;
        
        // Move walker
        const speed = 5 + Math.seededRandom() * 10;
        walker.x += Math.cos(walker.direction) * speed;
        walker.y += Math.sin(walker.direction) * speed;
        
        // Boundary handling - bounce off edges
        if (walker.x < 20 || walker.x > canvasWidth - 20) {
            walker.direction = Math.PI - walker.direction;
            walker.x = Math.max(20, Math.min(canvasWidth - 20, walker.x));
        }
        if (walker.y < 20 || walker.y > canvasHeight - 20) {
            walker.direction = -walker.direction;
            walker.y = Math.max(20, Math.min(canvasHeight - 20, walker.y));
        }
    }

    convertPointsToStructures(points, buildings, roads, parks, scale) {
        // Group points by type
        const grouped = {
            residential: [],
            commercial: [],
            road: [],
            park: []
        };

        points.forEach(point => {
            if (grouped[point.type]) {
                grouped[point.type].push(point);
            }
        });

        // Create buildings from residential and commercial points
        [...grouped.residential, ...grouped.commercial].forEach(point => {
            const buildingSize = (8 + Math.seededRandom() * 15) * scale;
            buildings.push({
                x: point.x - buildingSize / 2,
                y: point.y - buildingSize / 2,
                width: buildingSize,
                height: buildingSize,
                type: point.type,
                opacity: 1,
                floors: Math.floor(Math.seededRandom() * 4) + 1
            });
        });

        // Create road network from road points
        this.createRoadNetwork(grouped.road, roads, scale);

        // Create parks from park points
        grouped.park.forEach(point => {
            const parkSize = (15 + Math.seededRandom() * 25) * scale;
            parks.push({
                x: point.x - parkSize / 2,
                y: point.y - parkSize / 2,
                width: parkSize,
                height: parkSize,
                type: 'park',
                opacity: 1,
                features: ['trees', 'grass']
            });
        });
    }

    createRoadNetwork(roadPoints, roads, scale) {
        // Connect nearby road points to form a network
        const roadWidth = 6 * scale;
        const maxConnectionDistance = 50 * scale;

        roadPoints.forEach((point, i) => {
            for (let j = i + 1; j < roadPoints.length; j++) {
                const other = roadPoints[j];
                const distance = Math.sqrt(
                    Math.pow(point.x - other.x, 2) + 
                    Math.pow(point.y - other.y, 2)
                );

                if (distance < maxConnectionDistance) {
                    const isHorizontal = Math.abs(point.x - other.x) > Math.abs(point.y - other.y);
                    
                    roads.push({
                        x: Math.min(point.x, other.x) - roadWidth / 2,
                        y: Math.min(point.y, other.y) - roadWidth / 2,
                        width: isHorizontal ? Math.abs(point.x - other.x) + roadWidth : roadWidth,
                        height: isHorizontal ? roadWidth : Math.abs(point.y - other.y) + roadWidth,
                        direction: isHorizontal ? 'horizontal' : 'vertical',
                        type: 'organic',
                        opacity: 0.8
                    });
                }
            }
        });
    }
}
