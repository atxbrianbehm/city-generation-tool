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
            seed: 12345
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
}

// Export for browser global usage
window.TopographyGenerator = TopographyGenerator;
