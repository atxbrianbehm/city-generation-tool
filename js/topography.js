// Topography Generator
// Generates land/water grid using simple 2-D pseudo-noise so rivers / lakes look organic.
// For now we rely on a deterministic hash for noise so we don't pull external deps.

class TopographyGenerator {
    constructor(width, height, cellSize = 10, params = {}) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.params = Object.assign({
            waterCoverage: 0.3, // 0-1 fraction of water desired
            noiseFrequency: 0.05,
            seed: 12345,
            mode: 'lake', // 'lake', 'river', 'bay'
            riverWidth: 3,
            bayDirection: 'top' // 'top', 'bottom', 'left', 'right'
        }, params);
    }

    // 2-D hash -> pseudo random 0-1 (deterministic)
    hash(x, y) {
        const s = (x * 374761393 + y * 668265263 + this.params.seed * 374761397) >>> 0;
        let t = (s ^ (s >> 13)) >>> 0;
        t = (t * 1274126177) >>> 0;
        return (t & 0xfffffff) / 0xfffffff;
    }

    noise(x, y) {
        // Simple value noise with bilinear interpolation
        const fx = x * this.params.noiseFrequency;
        const fy = y * this.params.noiseFrequency;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const dx = fx - x0;
        const dy = fy - y0;

        function lerp(a, b, t) { return a + (b - a) * t; }

        const n00 = this.hash(x0, y0);
        const n10 = this.hash(x0 + 1, y0);
        const n01 = this.hash(x0, y0 + 1);
        const n11 = this.hash(x0 + 1, y0 + 1);

        const nx0 = lerp(n00, n10, dx);
        const nx1 = lerp(n01, n11, dx);
        return lerp(nx0, nx1, dy);
    }

    generate() {
        const waterCells = [];
        
        switch (this.params.mode) {
            case 'river':
                return this.generateRiver();
            case 'bay':
                return this.generateBay();
            default:
                return this.generateLake();
        }
    }

    generateLake() {
        const waterCells = [];
        const { waterCoverage } = this.params;
        for (let y = 0; y < this.height; y += this.cellSize) {
            for (let x = 0; x < this.width; x += this.cellSize) {
                const n = this.noise(x, y);
                if (n < waterCoverage) {
                    waterCells.push({ x, y, width: this.cellSize, height: this.cellSize });
                }
            }
        }
        return waterCells;
    }

    generateRiver() {
        const waterCells = [];
        const { riverWidth } = this.params;
        
        // Pick random start and end points on opposite edges
        const startSide = Math.floor(this.hash(100, 200) * 4);
        const endSide = (startSide + 2) % 4; // Opposite side
        
        const start = this.getEdgePoint(startSide);
        const end = this.getEdgePoint(endSide);
        
        // Trace path with some meandering
        const path = this.tracePath(start, end);
        
        // Create water cells along path
        path.forEach(point => {
            for (let dx = -riverWidth; dx <= riverWidth; dx++) {
                for (let dy = -riverWidth; dy <= riverWidth; dy++) {
                    const x = Math.floor((point.x + dx) / this.cellSize) * this.cellSize;
                    const y = Math.floor((point.y + dy) / this.cellSize) * this.cellSize;
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        if (!waterCells.some(w => w.x === x && w.y === y)) {
                            waterCells.push({ x, y, width: this.cellSize, height: this.cellSize });
                        }
                    }
                }
            }
        });
        
        return waterCells;
    }

    generateBay() {
        const waterCells = [];
        const { waterCoverage, bayDirection } = this.params;
        
        for (let y = 0; y < this.height; y += this.cellSize) {
            for (let x = 0; x < this.width; x += this.cellSize) {
                let threshold = waterCoverage;
                
                // Modify threshold based on distance from bay edge
                const edgeDistance = this.getDistanceFromBayEdge(x, y, bayDirection);
                const maxDistance = Math.max(this.width, this.height);
                threshold += (1 - edgeDistance / maxDistance) * 0.4; // Boost near bay edge
                
                const n = this.noise(x, y);
                if (n < threshold) {
                    waterCells.push({ x, y, width: this.cellSize, height: this.cellSize });
                }
            }
        }
        return waterCells;
    }

    getEdgePoint(side) {
        // 0=top, 1=right, 2=bottom, 3=left
        switch (side) {
            case 0: return { x: this.hash(side, 1) * this.width, y: 0 };
            case 1: return { x: this.width, y: this.hash(side, 1) * this.height };
            case 2: return { x: this.hash(side, 1) * this.width, y: this.height };
            case 3: return { x: 0, y: this.hash(side, 1) * this.height };
        }
    }

    tracePath(start, end) {
        const path = [];
        const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 10;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            
            // Add some noise for meandering
            const meander = this.noise(x * 0.01, y * 0.01) * 40 - 20;
            const perpX = -(end.y - start.y) / steps;
            const perpY = (end.x - start.x) / steps;
            
            path.push({
                x: x + perpX * meander,
                y: y + perpY * meander
            });
        }
        
        return path;
    }

    getDistanceFromBayEdge(x, y, direction) {
        switch (direction) {
            case 'top': return y;
            case 'bottom': return this.height - y;
            case 'left': return x;
            case 'right': return this.width - x;
            default: return Math.min(x, y, this.width - x, this.height - y);
        }
    }
}

// Export for browser global usage
window.TopographyGenerator = TopographyGenerator;
