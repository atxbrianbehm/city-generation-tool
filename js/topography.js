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

    /**
     * Build a regular elevation grid (noise values) over the area.
     * @returns {{ rows: number, cols: number, data: number[][] }}
     */
    generateElevationGrid() {
        const cols = Math.ceil(this.width / this.cellSize) + 1;
        const rows = Math.ceil(this.height / this.cellSize) + 1;
        const data = Array.from({ length: rows }, (_, j) =>
            Array.from({ length: cols }, (_, i) => {
                const x = i * this.cellSize;
                const y = j * this.cellSize;
                return this.noise(x, y);
            })
        );
        this.elevationGrid = { rows, cols, data };
        return this.elevationGrid;
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
        // Build elevation mask and threshold to generate lake footprint
        const { waterCoverage } = this.params;
        const { rows, cols, data } = this.generateElevationGrid();
        const waterCells = [];
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                if (data[j][i] < waterCoverage) {
                    const x = i * this.cellSize;
                    const y = j * this.cellSize;
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
        // Bay generation via elevation threshold + distance falloff
        const waterCells = [];
        const { waterCoverage, bayDirection } = this.params;
        const { rows, cols, data } = this.generateElevationGrid();
        const maxDistance = Math.max(this.width, this.height);
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = i * this.cellSize;
                const y = j * this.cellSize;
                let threshold = waterCoverage;
                const edgeDist = this.getDistanceFromBayEdge(x, y, bayDirection);
                threshold += (1 - edgeDist / maxDistance) * 0.4;
                if (data[j][i] < threshold) {
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

    /**
     * Extract coastline contours from the elevation grid via Marching Squares.
     * Returns an array of polygon loops in pixel coordinates.
     * @returns {Array<Array<{x:number,y:number}>>}
     */
    extractCoastlines() {
        if (!this.elevationGrid) this.generateElevationGrid();
        const { rows, cols, data } = this.elevationGrid;
        const threshold = this.params.waterCoverage;
        const cell = this.cellSize;

        // Helper to key points for linking segments
        const key = p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;

        // Collect segments
        const segments = [];
        for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const a = data[j][i] < threshold ? 1 : 0;
                const b = data[j][i+1] < threshold ? 1 : 0;
                const c = data[j+1][i+1] < threshold ? 1 : 0;
                const d = data[j+1][i] < threshold ? 1 : 0;
                const idx = (a<<3)|(b<<2)|(c<<1)|d;
                if (idx === 0 || idx === 15) continue;
                // mid-edge points
                const top    = { x: i*cell + cell/2, y: j*cell };
                const right  = { x: i*cell + cell,   y: j*cell + cell/2 };
                const bottom = { x: i*cell + cell/2, y: j*cell + cell };
                const left   = { x: i*cell,           y: j*cell + cell/2 };
                switch(idx) {
                    case 1:  segments.push([left,  bottom]); break;
                    case 2:  segments.push([bottom,right]); break;
                    case 3:  segments.push([left,  right]); break;
                    case 4:  segments.push([top,   right]); break;
                    case 5:  segments.push([top,   left], [bottom,right]); break;
                    case 6:  segments.push([top,   bottom]); break;
                    case 7:  segments.push([top,   left]); break;
                    case 8:  segments.push([top,   left]); break;
                    case 9:  segments.push([top,   bottom]); break;
                    case 10: segments.push([top,   right], [left,bottom]); break;
                    case 11: segments.push([top,   right]); break;
                    case 12: segments.push([left,  right]); break;
                    case 13: segments.push([bottom,right]); break;
                    case 14: segments.push([left,  bottom]); break;
                }
            }
        }

        // Link segments into loops
        const segMap = new Map();
        segments.forEach(([p1,p2]) => {
            for (const pt of [p1,p2]) {
                const k = key(pt);
                (segMap.get(k) || segMap.set(k,[]).get(k)).push([p1,p2]);
            }
        });
        const loops = [];
        const used = new Set();
        for (const seg of segments) {
            const segKey = `${key(seg[0])}|${key(seg[1])}`;
            if (used.has(segKey)) continue;
            const loop = [ seg[0], seg[1] ];
            used.add(segKey);
            let current = seg[1];
            while (true) {
                const k = key(current);
                const nextSegs = (segMap.get(k) || []).filter(s => {
                    const sKey = `${key(s[0])}|${key(s[1])}`;
                    return !used.has(sKey);
                });
                if (!nextSegs.length) break;
                const nextSeg = nextSegs[0];
                const [p1,p2] = nextSeg;
                const nxt = (key(p1) === key(current) ? p2 : p1);
                loop.push(nxt);
                used.add(`${key(p1)}|${key(p2)}`);
                current = nxt;
                if (key(current) === key(loop[0])) break;
            }
            if (loop.length > 2) loops.push(loop);
        }
        return loops;
    }
}

// Export for browser global usage
window.TopographyGenerator = TopographyGenerator;
