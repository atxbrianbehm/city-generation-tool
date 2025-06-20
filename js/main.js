/**
 * City Generation Tool - Main Application
 * Manages UI controls, algorithm coordination, and real-time updates
 */

class CityGenerationTool {
    constructor() {
        this.canvas = document.getElementById('city-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.algorithms = {};
        this.renderer = new CityRenderer(this.canvas);
        this.currentCity = null;
        // flag for throttled rendering
        this.renderRequested = false;
        this.isGenerating = false;
        
        this.initializeAlgorithms();
        this.setupEventListeners();
        this.updateCanvasSize();
        this.generateInitialCity();
    }

    initializeAlgorithms() {
        this.algorithms = {
            gridLayout: new GridLayoutAlgorithm(),
            poissonDisk: new PoissonDiskAlgorithm(),
            randomWalk: new RandomWalkAlgorithm(),
            cellularAutomata: new CellularAutomataAlgorithm(),
            voronoi: new VoronoiAlgorithm(),
            wfc: new WFCAlgorithm()
        };
    }

    setupEventListeners() {
        // Algorithm checkboxes and weight sliders
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const algorithmName = e.target.id.replace('-', '');
                const weightSlider = document.getElementById(algorithmName.replace(/([A-Z])/g, '-$1').toLowerCase() + '-weight');
                // Keep slider always enabled; if user unchecked box manually, reset weight to 0
                if (!e.target.checked && weightSlider) {
                    weightSlider.value = 0;
                    this.updateWeightDisplay(weightSlider);
                }
                this.normalizeWeights();
                this.generateCity();
            });
        });

        // Weight sliders (auto-enable on input ONLY; pointerdown interferes with drag)
        document.querySelectorAll('.blend-slider').forEach(slider => {
            slider.addEventListener('pointerdown',   e => e.stopPropagation());
            slider.addEventListener('pointermove',   e => e.stopPropagation());
            slider.addEventListener('pointerup',     e => e.stopPropagation());
            slider.addEventListener('pointercancel', e => e.stopPropagation());
            slider.addEventListener('click',        e => e.stopPropagation());
            const associatedCheckbox = slider.closest('.algorithm-item').querySelector('input[type="checkbox"]');
            slider.addEventListener('input', (e) => {
                if (associatedCheckbox && !associatedCheckbox.checked) {
                    associatedCheckbox.checked = true;
                }
                this.updateWeightDisplay(e.target);
                this.normalizeWeights();
                this.generateCity();
            });
        });

        /* ------- Algorithm checkbox -> dim value text if unchecked, but always enable sliders ------- */
        document.querySelectorAll('.algorithm-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const weightVal = item.querySelector('.weight-value');
            const syncDim = () => {
                if (weightVal) weightVal.style.opacity = checkbox.checked ? '1' : '0.4';
            };
            checkbox.addEventListener('change', syncDim);
            syncDim();
        });

        // Slider value indicators
        document.querySelectorAll('input[type="range"]').forEach(range => {
            if (range.dataset.hasIndicator) return;
            const span = document.createElement('span');
            span.className = 'slider-val';
            span.textContent = range.value;
            range.insertAdjacentElement('afterend', span);
            span.style.minWidth = '30px';
            range.dataset.hasIndicator = 'true';
            range.addEventListener('input', () => {
                span.textContent = range.value;
            });
        });

        // Parameter controls
        document.querySelectorAll('.algorithm-params input').forEach(input => {
            input.addEventListener('input', () => {
                this.generateCity();
            });
        });

        // Global controls
        document.querySelectorAll('.global-controls input').forEach(input => {
            input.addEventListener('input', () => {
                this.generateCity();
            });
        });

        // Canvas pan & zoom
        this.requestRender = () => {
            if (this.renderRequested) return;
            this.renderRequested = true;
            requestAnimationFrame(() => {
                this.renderRequested = false;
                this.renderer.render(this.currentCity);
            });
        };
        this.isPanning = false;
        let lastX = 0, lastY = 0;
        this.canvas.addEventListener('wheel', (e) => {
            if (e.target !== this.canvas) return;
            if (!e.ctrlKey && !e.metaKey) return; // require modifier to avoid page zoom
            // e.preventDefault(); // Removed to test if this interferes with sidebar slider drag
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            this.renderer.zoomAt(canvasX, canvasY, factor);
            this.requestRender();
        }, { passive: false });

        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.target !== this.canvas) return;
            if (e.button !== 0) return;
            this.isPanning = true;
            lastX = e.clientX;
            lastY = e.clientY;

        });
        this.canvas.addEventListener('pointermove', (e) => {
            if (e.target !== this.canvas) return;
            if (!this.isPanning) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            this.renderer.pan(dx, dy);
            this.requestRender();
        });
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.target !== this.canvas) return;
            this.isPanning = false;
        });

        /* ------- Touch pinch-zoom & two-finger pan ------- */
        this.activePointers = new Map();
        this.previousPinchDistance = null;
        this.previousMidpoint = null;

        const getPinchDistance = () => {
            const pts = Array.from(this.activePointers.values());
            const dx = pts[0].x - pts[1].x;
            const dy = pts[0].y - pts[1].y;
            return Math.hypot(dx, dy);
        };
        const getMidpoint = () => {
            const pts = Array.from(this.activePointers.values());
            return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        };

        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.target !== this.canvas) return;
            if (e.pointerType === 'touch') {
                this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }
        });
        this.canvas.addEventListener('pointermove', (e) => {
            if (e.target !== this.canvas) return;
            if (e.pointerType !== 'touch' || !this.activePointers.has(e.pointerId)) return;
            this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.activePointers.size === 2) {
                const rect = this.canvas.getBoundingClientRect();
                const newDist = getPinchDistance();
                // midpoint in *client* coords → canvas coords
                const rawMid = getMidpoint();
                const newMid = { x: rawMid.x - rect.left, y: rawMid.y - rect.top };
                if (this.previousPinchDistance != null) {
                    const factor = newDist / this.previousPinchDistance;
                    this.renderer.zoomAt(newMid.x, newMid.y, factor);
                    const dx = newMid.x - this.previousMidpoint.x;
                    const dy = newMid.y - this.previousMidpoint.y;
                    this.renderer.pan(dx, dy);
                    this.requestRender();
                }
                this.previousPinchDistance = newDist;
                this.previousMidpoint = newMid;
            } else if (this.activePointers.size === 1 && this.isPanning) {
                // single-finger pan already handled
            }
        });
        const clearPointer = (e) => {
            this.activePointers.delete(e.pointerId);
            if (this.activePointers.size < 2) {
                this.previousPinchDistance = null;
                this.previousMidpoint = null;
            }
        };
        this.canvas.addEventListener('pointerup', (e) => {
            if (e.target !== this.canvas) return;
            clearPointer(e);
        });
        this.canvas.addEventListener('pointercancel', (e) => {
            if (e.target !== this.canvas) return;
            clearPointer(e);
        });

        /* ------- Drag-and-drop algorithm ordering (SortableJS) ------- */
        if (window.Sortable) {
            new Sortable(document.querySelector('.algorithm-list'), {
                animation: 150,
                handle: '.algorithm-header',
                fallbackOnBody: true,
                swapThreshold: 0.65,
                onEnd: () => {
                    // After reorder, regenerate city to respect new primary algorithm
                    this.generateCity();
                }
            });
        }

        // Topography controls
        const waterSlider = document.getElementById('water-coverage');
        const waterVal = document.getElementById('water-coverage-val');
        waterSlider.addEventListener('input', (e) => {
            waterVal.textContent = `${e.target.value}%`;
            this.generateTopography(true);
        });
        
        const topoMode = document.getElementById('topo-mode');
        const riverWidthContainer = document.getElementById('river-width-container');
        const bayDirectionContainer = document.getElementById('bay-direction-container');
        const riverWidthSlider = document.getElementById('river-width');
        const riverWidthVal = document.getElementById('river-width-val');
        
        topoMode.addEventListener('change', (e) => {
            const mode = e.target.value;
            riverWidthContainer.style.display = mode === 'river' ? 'block' : 'none';
            bayDirectionContainer.style.display = mode === 'bay' ? 'block' : 'none';
            this.generateTopography(true);
        });
        
        riverWidthSlider.addEventListener('input', (e) => {
            riverWidthVal.textContent = e.target.value;
            this.generateTopography(true);
        });
        
        document.getElementById('generate-topo-btn').addEventListener('click', () => {
            this.generateTopography(true);
        });
        // Bay direction change
        document.getElementById('bay-direction').addEventListener('change', () => {
            this.generateTopography(true);
        });

        // Action buttons
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateCity();
        });

        document.getElementById('randomize-btn').addEventListener('click', () => {
            this.randomizeParameters();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportCity();
        });

        // Canvas resize handling
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            if (this.currentCity) {
               // Ensure no buildings overlap water
            if (this.waterCells && this.waterCells.length) {
                this.currentCity.buildings = this.currentCity.buildings.filter(b => !this.isInWater(b));
            }
            this.renderer.render(this.currentCity);
            }
        });

        // Initial topography preview on load
        this.generateTopography(true);
    }

    updateWeightDisplay(slider) {
        const valueElement = slider.nextElementSibling;
        if (valueElement && valueElement.classList.contains('weight-value')) {
            valueElement.textContent = `${slider.value}%`;
        }
    }

    normalizeWeights() {
        const sliders = document.querySelectorAll('.blend-slider');
        const activeSliders = Array.from(sliders).filter(slider => 
            !slider.disabled && parseInt(slider.value) > 0
        );

        if (activeSliders.length === 0) return;

        const totalWeight = activeSliders.reduce((sum, slider) => sum + parseInt(slider.value), 0);
        
        if (totalWeight > 100) {
            const scale = 100 / totalWeight;
            activeSliders.forEach(slider => {
                slider.value = Math.max(1, Math.round(parseInt(slider.value) * scale));
                this.updateWeightDisplay(slider);
            });
        }
    }

    getActiveAlgorithms() {
        const active = [];
        const sliderIdMap = {
            'grid-layout': 'grid-weight',
            'poisson-disk': 'poisson-weight',
            'random-walk': 'random-walk-weight',
            'cellular-automata': 'cellular-automata-weight',
            'voronoi': 'voronoi-weight',
            'wfc': 'wfc-weight'
        };
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const algorithmKey = this.getAlgorithmKey(checkbox.id);
            const sliderId = sliderIdMap[checkbox.id];
            const weightSlider = document.getElementById(sliderId);
            if (!weightSlider) {
                console.warn(`Weight slider not found for algorithm: ${algorithmKey} (expected id: ${sliderId})`);
                return; // Skip this algorithm if slider is missing
            }
            const weight = parseInt(weightSlider.value) / 100;
            
            if (weight > 0 && this.algorithms[algorithmKey]) {
                active.push({
                    name: algorithmKey,
                    algorithm: this.algorithms[algorithmKey],
                    weight: weight,
                    params: this.getAlgorithmParams(algorithmKey)
                });
            }
        });

        return active;
    }

    getAlgorithmKey(checkboxId) {
        const keyMap = {
            'grid-layout': 'gridLayout',
            'poisson-disk': 'poissonDisk',
            'random-walk': 'randomWalk',
            'cellular-automata': 'cellularAutomata',
            'voronoi': 'voronoi',
            'wfc': 'wfc'
        };
        return keyMap[checkboxId] || checkboxId;
    }

    getAlgorithmParams(algorithmKey) {
        const paramMap = {
            gridLayout: {
                gridSize: document.getElementById('grid-size')?.value || 20,
                streetWidth: document.getElementById('street-width')?.value || 2,
                density: document.getElementById('grid-density')?.value || 0.7
            },
            poissonDisk: {
                minDistance: document.getElementById('poisson-distance')?.value || 30,
                maxAttempts: document.getElementById('poisson-attempts')?.value || 30
            },
            randomWalk: {
                walkerCount: document.getElementById('walker-count')?.value || 5,
                steps: document.getElementById('walker-steps')?.value || 200,
                depositChance: document.getElementById('deposit-chance')?.value || 0.3
            },
            cellularAutomata: {
                generations: document.getElementById('cellular-generations')?.value || 5,
                neighborThreshold: document.getElementById('neighbor-threshold')?.value || 4
            },
            voronoi: {
                seedPoints: document.getElementById('voronoi-seeds')?.value || 25,
                buildingsPerCell: document.getElementById('buildings-per-cell')?.value || 5
            },
            wfc: {
                tileSize: document.getElementById('tile-size')?.value || 10,
                entropyThreshold: document.getElementById('entropy-threshold')?.value || 3
            }
        };

        return paramMap[algorithmKey] || {};
    }

    getGlobalParams() {
        return {
            scale: parseFloat(document.getElementById('global-scale')?.value || 1),
            randomness: parseFloat(document.getElementById('global-randomness')?.value || 0.5),
            seed: parseInt(document.getElementById('global-seed')?.value || 12345),
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        };
    }

    /**
     * Generate water topography grid. If preview === true we immediately render
     * the water-only layer so the user can see the result; otherwise we just
     * compute the waterCells array for use during full city generation.
     * @param {boolean} [preview=true]
     */
    generateTopography(preview = true) {
        const coverage = parseInt(document.getElementById('water-coverage').value) / 100;
        const mode = document.getElementById('topo-mode').value;
        const riverWidth = mode === 'river' ? parseInt(document.getElementById('river-width').value) : 0;
        const bayDirection = mode === 'bay' ? document.getElementById('bay-direction').value : 'top';
        const topoGen = new TopographyGenerator(this.canvas.width, this.canvas.height, 10, {
            waterCoverage: coverage,
            seed: this.getGlobalParams().seed,
            mode,
            riverWidth,
            bayDirection
        });
        console.debug('Topography preview [preview=' + preview + ']:', { coverage, mode, riverWidth, bayDirection });
        this.waterCells = topoGen.generate();
        this.coastPolygons = topoGen.extractCoastlines();
        // If requested, render only the topography so the user can preview the smooth coastlines
        if (preview) {
            this.renderer.render({ buildings: [], roads: [], parks: [], water: this.coastPolygons });
        }
    }

    async generateCity() {
        // Ensure we have water data; auto-generate if the user hasn't done so yet.
        if (!this.waterCells) {
            this.generateTopography(false);
        }
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        const startTime = performance.now();
        
        try {
            const activeAlgorithms = this.getActiveAlgorithms();
            const globalParams = this.getGlobalParams();
            
            if (activeAlgorithms.length === 0) {
                this.currentCity = { buildings: [], roads: [], parks: [], water: this.waterCells };
            } else {
                this.currentCity = await this.blendAlgorithms(activeAlgorithms, globalParams);
            }
            
            this.renderer.render(this.currentCity);
            
            const endTime = performance.now();
            this.updateStats(this.currentCity, endTime - startTime);
            
        } catch (error) {
            console.error('Error generating city:', error);
        } finally {
            this.isGenerating = false;
        }
    }

    async blendAlgorithms(activeAlgorithms, globalParams) {
        const results = [];
        
        // Generate results from each active algorithm
        for (const algorithmConfig of activeAlgorithms) {
            const result = await algorithmConfig.algorithm.generate({
                ...algorithmConfig.params,
                ...globalParams
            });
            
            results.push({
                ...result,
                weight: algorithmConfig.weight
            });
        }
        
        // Blend the results
        return this.blendResults(results, globalParams);
    }

    isInWater(rect) {
        if (!this.waterCells) return false;
        return this.waterCells.some(w => rect.x < w.x + w.width && rect.x + rect.width > w.x && rect.y < w.y + w.height && rect.y + rect.height > w.y);
    }

    blendResults(results, globalParams) {
        const blended = {
            // Use smooth coastline polygons if available, otherwise fall back to waterCells squares
            water: (this.coastPolygons && this.coastPolygons.length)
                ? this.coastPolygons
                : (this.waterCells || []),
            buildings: [],
            roads: [],
            parks: []
        };
        
        results.forEach(result => {
            // Scale each result by its weight and add to blended output
            Object.keys(blended).forEach(key => {
                if (result[key]) {
                    const scaledFeatures = result[key].map(feature => ({
                        ...feature,
                        opacity: (feature.opacity || 1) * result.weight
                    }));
                    blended[key].push(...scaledFeatures);
                }
            });
        });
        
        // Apply global randomness and cleanup
        this.applyGlobalEffects(blended, globalParams);
        
        return blended;
    }

    applyGlobalEffects(city, globalParams) {
        const { randomness, seed } = globalParams;
        
        // Seed random number generator for consistent results
        Math.seedrandom(seed);
        
        // Apply randomness to positions and properties
        Object.keys(city).forEach(key => {
            city[key].forEach(feature => {
                if (randomness > 0) {
                    feature.x += (Math.random() - 0.5) * randomness * 20;
                    feature.y += (Math.random() - 0.5) * randomness * 20;
                }
            });
        });
    }

    randomizeParameters() {
        // Randomize algorithm weights
        const sliders = document.querySelectorAll('.blend-slider');
        const activeCount = Math.floor(Math.random() * 3) + 1; // 1-3 active algorithms
        
        sliders.forEach((slider, index) => {
            const checkbox = slider.parentElement.querySelector('input[type="checkbox"]');
            if (index < activeCount) {
                checkbox.checked = true;
                slider.disabled = false;
                slider.value = Math.floor(Math.random() * 80) + 20; // 20-100%
            } else {
                checkbox.checked = false;
                slider.disabled = true;
                slider.value = 0;
            }
            this.updateWeightDisplay(slider);
        });
        
        // Randomize parameters
        document.querySelectorAll('.algorithm-params input').forEach(input => {
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            const step = parseFloat(input.step) || 1;
            const range = max - min;
            const value = min + Math.floor(Math.random() * (range / step)) * step;
            input.value = value;
        });
        
        // Randomize global seed
        document.getElementById('global-seed').value = Math.floor(Math.random() * 100000);
        
        this.normalizeWeights();
        this.generateCity();
    }

    exportCity() {
        if (!this.currentCity) return;
        
        const exportData = {
            timestamp: new Date().toISOString(),
            city: this.currentCity,
            parameters: {
                algorithms: this.getActiveAlgorithms(),
                global: this.getGlobalParams()
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `city-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    updateStats(city, generationTime) {
        const buildingCount = city.buildings?.length || 0;
        const roadCount = city.roads?.length || 0;
        const statsElement = document.getElementById('generation-stats');
        
        if (statsElement) {
            statsElement.innerHTML = `
                <span>Buildings: ${buildingCount}</span>
                <span>Roads: ${roadCount}</span>
                <span>Time: ${Math.round(generationTime)}ms</span>
            `;
        }
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const maxWidth = containerRect.width - 32; // Account for padding
        const maxHeight = window.innerHeight - 300; // Leave space for controls
        
        this.canvas.width = Math.min(800, maxWidth);
        this.canvas.height = Math.min(600, maxHeight);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
    }

    generateInitialCity() {
        // Generate an initial city with grid layout
        document.getElementById('grid-layout').checked = true;
        this.generateCity();
    }
}

// Utility function for seeded random numbers
Math.seedrandom = function(seed) {
    Math._seed = seed % 2147483647;
    if (Math._seed <= 0) Math._seed += 2147483646;
};

Math.seededRandom = function() {
    Math._seed = Math._seed * 16807 % 2147483647;
    return (Math._seed - 1) / 2147483646;
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cityTool = new CityGenerationTool();
});
