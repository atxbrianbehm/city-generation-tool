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

    /**
     * Compute flow directions for each grid cell based on lowest adjacent elevation.
     * Populates this.flowDirGrid with [row,col] or null.
     * @returns {Array<Array<[number,number]>>}
     */
    computeFlowDirections() {
        if (!this.elevationGrid) this.generateElevationGrid();
        const { rows, cols, data } = this.elevationGrid;
        const flow = Array.from({ length: rows }, () => Array(cols).fill(null));
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                let minH = data[j][i];
                let next = null;
                // Check 8 neighbors
                for (let dj = -1; dj <= 1; dj++) {
                    for (let di = -1; di <= 1; di++) {
                        if (!di && !dj) continue;
                        const nj = j + dj, ni = i + di;
                        if (nj >= 0 && nj < rows && ni >= 0 && ni < cols) {
                            const h = data[nj][ni];
                            if (h < minH) {
                                minH = h;
                                next = [nj, ni];
                            }
                        }
                    }
                }
                flow[j][i] = next;
            }
        }
        this.flowDirGrid = flow;
        return flow;
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
        // Flow-routing based river path following elevation gradient
        const { riverWidth } = this.params;
        // Ensure we have elevation grid
        if (!this.elevationGrid) this.generateElevationGrid();
        const { rows, cols } = this.elevationGrid;
        // Compute flow directions
        const flowDir = this.computeFlowDirections();
        // Pick random start on top edge where flow exists
        const candidates = [];
        for (let i = 0; i < cols; i++) {
            if (flowDir[0][i]) candidates.push([0, i]);
        }
        const start = candidates.length > 0
            ? candidates[Math.floor(this.hash(0, 1) * candidates.length)]
            : [0, Math.floor(this.hash(0,1) * cols)];
        // Trace downstream path
        const path = this.getFlowPath(start[0], start[1]);
        // Carve river width around path
        const waterCells = [];
        path.forEach(pt => {
            for (let dx = -riverWidth; dx <= riverWidth; dx++) {
                for (let dy = -riverWidth; dy <= riverWidth; dy++) {
                    const x = Math.floor((pt.x + dx) / this.cellSize) * this.cellSize;
                    const y = Math.floor((pt.y + dy) / this.cellSize) * this.cellSize;
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

    /**
     * Trace flow path from a grid cell following flow directions.
     * @param {number} row Starting row index
     * @param {number} col Starting column index
     * @returns {Array<{x:number,y:number}>} pixel coordinates along the path
     */
    getFlowPath(row, col) {
        const path = [];
        let current = [row, col];
        while (current) {
            const [j, i] = current;
            path.push({ x: i * this.cellSize, y: j * this.cellSize });
            current = this.flowDirGrid[j][i];
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
     * Extract coastline contours from the elevation grid via Marching Squares,
     * separating connected water bodies into ocean vs lakes via flood-fill.
     * @returns {Array<Array<{x:number,y:number}>>} polygon loops
     */
    extractCoastlines() {
        if (!this.elevationGrid) this.generateElevationGrid();
        const { rows, cols, data } = this.elevationGrid;
        const threshold = this.params.waterCoverage;

        // Build base water mask and find connected components
        const baseMask = data.map(row => row.map(v => v < threshold));
        const blobs = this.computeWaterBlobs(baseMask, rows, cols);
        const loops = [];

        // Extract polygons for each blob
        blobs.forEach(blob => {
            const polyLoops = this.marchingSquaresOnMask(blob.mask);
            loops.push(...polyLoops);
        });
        return loops;
    }

    /**
     * Compute connected water blobs from a boolean mask.
     * @param {boolean[][]} mask
     * @param {number} rows
     * @param {number} cols
     * @returns {{mask:boolean[][], type:string}[]}
     */
    computeWaterBlobs(mask, rows, cols) {
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        const blobs = [];
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                if (!mask[j][i] || visited[j][i]) continue;
                const stack = [[j, i]];
                const blobMask = Array.from({ length: rows }, () => Array(cols).fill(false));
                let touchesBoundary = false;
                while (stack.length) {
                    const [y, x] = stack.pop();
                    if (visited[y][x]) continue;
                    visited[y][x] = true;
                    blobMask[y][x] = true;
                    if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) touchesBoundary = true;
                    // 4-neighbor flood-fill
                    [[y-1,x],[y+1,x],[y,x-1],[y,x+1]].forEach(([ny,nx]) => {
                        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols
                            && mask[ny][nx] && !visited[ny][nx]) {
                            stack.push([ny,nx]);
                        }
                    });
                }
                blobs.push({ mask: blobMask, type: touchesBoundary ? 'ocean' : 'lake' });
            }
        }
        return blobs;
    }

    /**
     * Apply Marching Squares on a boolean mask to extract polygon loops.
     * @param {boolean[][]} mask
     * @returns {Array<Array<{x:number,y:number}>>}
     */
    marchingSquaresOnMask(mask) {
        const rows = mask.length;
        const cols = mask[0].length;
        const cell = this.cellSize;
        // Helper to key points
        const keyPt = p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
        const segments = [];
        for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const a = mask[j][i] ? 1 : 0;
                const b = mask[j][i+1] ? 1 : 0;
                const c = mask[j+1][i+1] ? 1 : 0;
                const d = mask[j+1][i] ? 1 : 0;
                const idx = (a<<3)|(b<<2)|(c<<1)|d;
                if (idx === 0 || idx === 15) continue;
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
            [p1,p2].forEach(pt => {
                const k = keyPt(pt);
                (segMap.get(k) || segMap.set(k,[]).get(k)).push([p1,p2]);
            });
        });
        const loops = [];
        const used = new Set();
        for (const seg of segments) {
            const k0 = keyPt(seg[0]), k1 = keyPt(seg[1]);
            const segKey = `${k0}|${k1}`;
            if (used.has(segKey)) continue;
            const loop = [seg[0], seg[1]];
            used.add(segKey);
            let current = seg[1];
            while (true) {
                const nextSegs = (segMap.get(keyPt(current)) || []).filter(s => {
                    const kk0 = keyPt(s[0]), kk1 = keyPt(s[1]);
                    const k = `${kk0}|${kk1}`;
                    return !used.has(k);
                });
                if (!nextSegs.length) break;
                const [p1,p2] = nextSegs[0];
                const nxt = (keyPt(p1) === keyPt(current) ? p2 : p1);
                loop.push(nxt);
                used.add(`${keyPt(p1)}|${keyPt(p2)}`);
                current = nxt;
                if (keyPt(current) === keyPt(loop[0])) break;
            }
            if (loop.length > 2) loops.push(loop);
        }
        return loops;
    }
}

// Export for browser global usage
window.TopographyGenerator = TopographyGenerator;
