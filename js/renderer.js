/**
 * City Renderer - Handles visual representation of generated cities
 * Supports various building types, roads, parks, and water features
 */

class CityRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.colors = {
            buildings: {
                residential: '#4a9d4a',
                commercial: '#5a7bc7',
                industrial: '#8a8a8a',
                mixed: '#a569c7'
            },
            roads: '#888',
            parks: '#2d7a2d',
            water: '#4c9aff',
            background: '#2a2a2a'
        };
    }

    render(city) {
        if (!city) return;
        
        this.clearCanvas();
        this.drawBackground();
        
        // Apply pan & zoom transform (scale first, then translate). Translation
        // offsets are in screen pixels, unaffected by zoom level.
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.offsetX, this.offsetY);

        // Render in layers for proper z-ordering
        this.drawWater(city.water || []);
        this.drawParks(city.parks || []);
        this.drawRoads(city.roads || []);
        this.drawBuildings(city.buildings || []);
        this.drawGrid();

        this.ctx.restore();

        this.drawScaleBar();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBuildings(buildings) {
        buildings.forEach(building => {
            this.drawBuilding(building);
        });
    }

    drawBuilding(building) {
        const { x, y, width, height, type, opacity } = building;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity || 1;
        
        // Building body
        this.ctx.fillStyle = this.colors.buildings[type] || this.colors.buildings.residential;
        this.ctx.fillRect(x, y, width, height);
        
        // Building outline
        this.ctx.strokeStyle = this.darkenColor(this.colors.buildings[type] || this.colors.buildings.residential, 0.3);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Add some detail based on building type
        this.addBuildingDetails(building);
        
        this.ctx.restore();
    }

    addBuildingDetails(building) {
        const { x, y, width, height, type } = building;
        
        switch (type) {
            case 'residential':
                this.drawResidentialDetails(x, y, width, height);
                break;
            case 'commercial':
                this.drawCommercialDetails(x, y, width, height);
                break;
            case 'industrial':
                this.drawIndustrialDetails(x, y, width, height);
                break;
        }
    }

    drawResidentialDetails(x, y, width, height) {
        // Draw windows
        const windowSize = Math.min(3, width / 6, height / 6);
        const windowColor = '#FFFACD';
        
        this.ctx.fillStyle = windowColor;
        for (let wx = x + windowSize; wx < x + width - windowSize; wx += windowSize * 2) {
            for (let wy = y + windowSize; wy < y + height - windowSize; wy += windowSize * 2) {
                this.ctx.fillRect(wx, wy, windowSize, windowSize);
            }
        }
        
        // Draw door
        if (width > 6 && height > 6) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + width / 2 - 1, y + height - 3, 2, 3);
        }
    }

    drawCommercialDetails(x, y, width, height) {
        // Draw larger windows
        const windowWidth = Math.min(width / 3, 8);
        const windowHeight = Math.min(height / 4, 6);
        
        this.ctx.fillStyle = '#E6E6FA';
        for (let wx = x + 2; wx < x + width - windowWidth; wx += windowWidth + 2) {
            for (let wy = y + 2; wy < y + height - windowHeight; wy += windowHeight + 2) {
                this.ctx.fillRect(wx, wy, windowWidth, windowHeight);
            }
        }
    }

    drawIndustrialDetails(x, y, width, height) {
        // Draw industrial features like vents or chimneys
        if (width > 10 && height > 10) {
            this.ctx.fillStyle = '#A9A9A9';
            this.ctx.fillRect(x + width * 0.7, y - 2, 3, 2); // Chimney
            
            // Vent
            this.ctx.fillRect(x + width * 0.3, y + height * 0.3, width * 0.2, height * 0.2);
        }
    }

    drawRoads(roads) {
        this.ctx.strokeStyle = this.colors.roads;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        roads.forEach(road => {
            this.drawRoad(road);
        });
        
        // Draw road markings
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        roads.forEach(road => {
            this.drawRoadMarkings(road);
        });
        
        this.ctx.setLineDash([]);
    }

    drawRoad(road) {
        const { x, y, width, height, opacity, direction } = road;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity || 1;
        
        const lineWidth = direction === 'horizontal' ? height : width;
        this.ctx.strokeStyle = this.colors.roads;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';

        if (direction === 'horizontal') {
            const centerY = y + height / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, centerY);
            this.ctx.lineTo(x + width, centerY);
            this.ctx.stroke();
        } else if (direction === 'vertical') {
            const centerX = x + width / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, y);
            this.ctx.lineTo(centerX, y + height);
            this.ctx.stroke();
        } else {
            // Fallback rectangle
            this.ctx.fillStyle = this.colors.roads;
            this.ctx.fillRect(x, y, width, height);
        }
        
        this.ctx.restore();
    }

    drawRoadMarkings(road) {
        const { x, y, width, height, direction } = road;
        
        // Only draw markings for roads wider than 8px
        if (direction === 'horizontal' && height > 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + height / 2);
            this.ctx.lineTo(x + width, y + height / 2);
            this.ctx.stroke();
        } else if (direction === 'vertical' && width > 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + width / 2, y);
            this.ctx.lineTo(x + width / 2, y + height);
            this.ctx.stroke();
        }
    }

    drawParks(parks) {
        parks.forEach(park => {
            this.drawPark(park);
        });
    }

    drawPark(park) {
        const { x, y, width, height, opacity } = park;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity || 1;
        
        // Park base
        this.ctx.fillStyle = this.colors.parks;
        this.ctx.fillRect(x, y, width, height);
        
        // Add park details (trees, paths)
        this.drawParkDetails(x, y, width, height);
        
        this.ctx.restore();
    }

    drawParkDetails(x, y, width, height) {
        // Draw trees
        const treeCount = Math.floor((width * height) / 200);
        this.ctx.fillStyle = '#006400';
        
        for (let i = 0; i < treeCount; i++) {
            const treeX = x + Math.random() * (width - 4) + 2;
            const treeY = y + Math.random() * (height - 4) + 2;
            
            // Tree canopy
            this.ctx.beginPath();
            this.ctx.arc(treeX, treeY, 2, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Tree trunk
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(treeX - 0.5, treeY + 1, 1, 2);
            this.ctx.fillStyle = '#006400';
        }
        
        // Draw paths
        if (width > 20 && height > 20) {
            this.ctx.strokeStyle = '#D2B48C';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, y + height / 2);
            this.ctx.lineTo(x + width - 2, y + height / 2);
            this.ctx.stroke();
        }
    }

    drawWater(waterFeatures) {
        waterFeatures.forEach(water => {
            this.drawWaterFeature(water);
        });
    }

    drawWaterFeature(water) {
        const { x, y, width, height, opacity } = water;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity || 1;
        
        // Water body
        this.ctx.fillStyle = this.colors.water;
        this.ctx.fillRect(x, y, width, height);
        
        // Water shimmer effect
        this.ctx.fillStyle = this.lightenColor(this.colors.water, 0.2);
        for (let i = 0; i < 5; i++) {
            const shimmerX = x + Math.random() * width;
            const shimmerY = y + Math.random() * height;
            this.ctx.fillRect(shimmerX, shimmerY, 2, 1);
        }
        
        this.ctx.restore();
    }

    drawGrid() {
        // Optional grid overlay for debugging
        const gridSize = 20;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    pan(dx, dy) {
        // Offsets are stored in screen pixels (translation applied after scale),
        // so we simply add the raw pointer delta.
        this.offsetX += dx;
        this.offsetY += dy;
    }

    zoomAt(screenX, screenY, factor) {
        // Convert screen → world for scale-then-translate model.
        const worldX = (screenX - this.offsetX) / this.scale;
        const worldY = (screenY - this.offsetY) / this.scale;

        // Clamp scale
        this.scale = Math.max(0.25, Math.min(4, this.scale * factor));

        // Recompute offset so the zoom happens about the cursor (keeps anchor)
        this.offsetX = screenX - worldX * this.scale;
        this.offsetY = screenY - worldY * this.scale;
    }

    drawScaleBar() {
        // Choose "nice" bar length 10-1000 m that falls between 80-150 px
        const candidateMetres = [10, 20, 50, 100, 200, 500, 1000];
        const metresPerPixel = 1 / this.scale; // 1 px ≈ 1 m at scale 1
        let barMetres = 100;
        for (const m of candidateMetres) {
            const px = m / metresPerPixel;
            if (px >= 80 && px <= 150) { barMetres = m; break; }
        }
        const barWidth = barMetres / metresPerPixel;
        const barHeight = 6;
        const margin = 20;
        const x = this.canvas.width - barWidth - margin;
        const y = this.canvas.height - barHeight - 40;

        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // outline
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`${barMetres} m`, x + barWidth / 2, y + barHeight + 4);
    }


    // Utility functions for color manipulation
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + factor)));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + factor)));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + factor)));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Coordinate transformation methods for zooming and panning
    setTransform(scale, offsetX, offsetY) {
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    transformX(x) {
        return (x + this.offsetX) * this.scale;
    }

    transformY(y) {
        return (y + this.offsetY) * this.scale;
    }

    transformWidth(width) {
        return width * this.scale;
    }

    transformHeight(height) {
        return height * this.scale;
    }
}
