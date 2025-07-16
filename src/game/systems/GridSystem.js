import { EventBus } from '../EventBus';

export class GridSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.rows = config.rows || 6;
        this.cols = config.cols || 12;
        
        // 网格布局配置
        this.gameArea = null;
        this.gridSize = null;
        
        // 网格数据 - 二维数组存储网格状态
        this.grid = Array(this.rows).fill().map((_, row) => 
            Array(this.cols).fill().map((_, col) => ({
                row,
                col,
                occupied: false,
                occupant: null,
                state: 'idle', // 'idle', 'hover', 'selected', 'invalid'
                lane: this.getLaneType(row)
            }))
        );
        
        // 当前悬停和选中的网格
        this.hoveredCell = null;
        this.selectedCell = null;
        
        // 可视化图形对象
        this.gridGraphics = null;
        this.hoverGraphics = null;
        this.selectionGraphics = null;
        
        this.init();
    }
    
    init() {
        // 创建图形对象
        this.gridGraphics = this.scene.add.graphics();
        this.hoverGraphics = this.scene.add.graphics();
        this.selectionGraphics = this.scene.add.graphics();
        
        // 设置图形层级
        this.gridGraphics.setDepth(1);
        this.hoverGraphics.setDepth(2);
        this.selectionGraphics.setDepth(3);
        
        // 添加输入监听
        this.setupInputHandlers();
    }
    
    // 根据行数确定路径类型
    getLaneType(row) {
        if (row >= 0 && row <= 1) return 'gas';      // 气态路径
        if (row >= 2 && row <= 3) return 'liquid';   // 液态路径
        if (row >= 4 && row <= 5) return 'solid';    // 固态路径
        return 'unknown';
    }
    
    // 设置网格布局
    setLayout(gameArea, gridSize) {
        this.gameArea = gameArea;
        this.gridSize = gridSize;
        this.drawGrid();
    }
    
    // 绘制网格线
    drawGrid() {
        if (!this.gameArea || !this.gridSize) return;
        
        this.gridGraphics.clear();
        
        // 设置网格线样式
        this.gridGraphics.lineStyle(1, 0x0f3460, 0.5);
        
        // 绘制垂直线
        for (let col = 0; col <= this.cols; col++) {
            const x = this.gameArea.x + col * this.gridSize.width;
            this.gridGraphics.moveTo(x, this.gameArea.y);
            this.gridGraphics.lineTo(x, this.gameArea.y + this.gameArea.height);
        }
        
        // 绘制水平线
        for (let row = 0; row <= this.rows; row++) {
            const y = this.gameArea.y + row * this.gridSize.height;
            this.gridGraphics.moveTo(this.gameArea.x, y);
            this.gridGraphics.lineTo(this.gameArea.x + this.gameArea.width, y);
        }
        
        this.gridGraphics.strokePath();
    }
    
    // 设置输入处理器
    setupInputHandlers() {
        // 鼠标移动事件
        this.scene.input.on('pointermove', (pointer) => {
            this.handlePointerMove(pointer);
        });
        
        // 鼠标点击事件
        this.scene.input.on('pointerdown', (pointer) => {
            this.handlePointerDown(pointer);
        });
        
        // 鼠标离开游戏区域时清除悬停效果
        this.scene.input.on('pointerout', () => {
            this.clearHover();
        });
    }
    
    // 处理鼠标移动
    handlePointerMove(pointer) {
        const cell = this.screenToGrid(pointer.x, pointer.y);
        
        if (cell && this.isValidCell(cell.row, cell.col)) {
            this.setHoveredCell(cell.row, cell.col);
        } else {
            this.clearHover();
        }
    }
    
    // 处理鼠标点击
    handlePointerDown(pointer) {
        const cell = this.screenToGrid(pointer.x, pointer.y);
        
        if (cell && this.isValidCell(cell.row, cell.col)) {
            this.selectCell(cell.row, cell.col);
            
            // 发送网格点击事件
            EventBus.emit('grid-cell-clicked', {
                row: cell.row,
                col: cell.col,
                cell: this.grid[cell.row][cell.col],
                worldPos: this.gridToWorld(cell.row, cell.col)
            });
        }
    }
    
    // 屏幕坐标转网格坐标
    screenToGrid(screenX, screenY) {
        if (!this.gameArea || !this.gridSize) return null;
        
        // 检查是否在游戏区域内
        if (screenX < this.gameArea.x || screenX > this.gameArea.x + this.gameArea.width ||
            screenY < this.gameArea.y || screenY > this.gameArea.y + this.gameArea.height) {
            return null;
        }
        
        const col = Math.floor((screenX - this.gameArea.x) / this.gridSize.width);
        const row = Math.floor((screenY - this.gameArea.y) / this.gridSize.height);
        
        return { row, col };
    }
    
    // 网格坐标转世界坐标（网格中心点）
    gridToWorld(row, col) {
        if (!this.gameArea || !this.gridSize) return null;
        
        const x = this.gameArea.x + col * this.gridSize.width + this.gridSize.width / 2;
        const y = this.gameArea.y + row * this.gridSize.height + this.gridSize.height / 2;
        
        return { x, y };
    }
    
    // 网格坐标转屏幕区域（用于绘制高亮框）
    gridToRect(row, col) {
        if (!this.gameArea || !this.gridSize) return null;
        
        const x = this.gameArea.x + col * this.gridSize.width;
        const y = this.gameArea.y + row * this.gridSize.height;
        
        return {
            x,
            y,
            width: this.gridSize.width,
            height: this.gridSize.height
        };
    }
    
    // 检查网格坐标是否有效
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    // 设置悬停的网格
    setHoveredCell(row, col) {
        // 如果已经是当前悬停的网格，不需要重复处理
        if (this.hoveredCell && this.hoveredCell.row === row && this.hoveredCell.col === col) {
            return;
        }
        
        // 清除之前的悬停状态
        this.clearHover();
        
        // 设置新的悬停状态
        this.hoveredCell = { row, col };
        this.grid[row][col].state = 'hover';
        
        // 绘制悬停效果
        this.drawHoverEffect(row, col);
        
        // 发送悬停事件
        EventBus.emit('grid-cell-hover', {
            row,
            col,
            cell: this.grid[row][col]
        });
    }
    
    // 清除悬停效果
    clearHover() {
        if (this.hoveredCell) {
            const { row, col } = this.hoveredCell;
            if (this.grid[row] && this.grid[row][col]) {
                this.grid[row][col].state = this.selectedCell && 
                    this.selectedCell.row === row && this.selectedCell.col === col ? 'selected' : 'idle';
            }
            this.hoveredCell = null;
        }
        
        this.hoverGraphics.clear();
    }
    
    // 选择网格
    selectCell(row, col) {
        // 清除之前的选择状态
        this.clearSelection();
        
        // 设置新的选择状态
        this.selectedCell = { row, col };
        this.grid[row][col].state = 'selected';
        
        // 绘制选择效果
        this.drawSelectionEffect(row, col);
        
        // 发送选择事件
        EventBus.emit('grid-cell-selected', {
            row,
            col,
            cell: this.grid[row][col]
        });
    }
    
    // 清除选择效果
    clearSelection() {
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            if (this.grid[row] && this.grid[row][col]) {
                this.grid[row][col].state = 'idle';
            }
            this.selectedCell = null;
        }
        
        this.selectionGraphics.clear();
    }
    
    // 绘制悬停效果
    drawHoverEffect(row, col) {
        const rect = this.gridToRect(row, col);
        if (!rect) return;
        
        this.hoverGraphics.clear();
        this.hoverGraphics.fillStyle(0x87CEEB, 0.3); // 天蓝色半透明
        this.hoverGraphics.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    
    // 绘制选择效果
    drawSelectionEffect(row, col) {
        const rect = this.gridToRect(row, col);
        if (!rect) return;
        
        this.selectionGraphics.clear();
        this.selectionGraphics.lineStyle(3, 0xe94560, 1); // 红色边框
        this.selectionGraphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    
    // 设置网格占用状态
    setOccupied(row, col, occupant = null) {
        if (!this.isValidCell(row, col)) return false;
        
        this.grid[row][col].occupied = true;
        this.grid[row][col].occupant = occupant;
        
        return true;
    }
    
    // 清除网格占用状态
    clearOccupied(row, col) {
        if (!this.isValidCell(row, col)) return false;
        
        this.grid[row][col].occupied = false;
        this.grid[row][col].occupant = null;
        
        return true;
    }
    
    // 检查网格是否可以放置建筑
    canPlace(row, col) {
        if (!this.isValidCell(row, col)) return false;
        return !this.grid[row][col].occupied;
    }
    
    // 获取网格信息
    getCell(row, col) {
        if (!this.isValidCell(row, col)) return null;
        return this.grid[row][col];
    }
    
    // 响应式布局更新
    resize(gameArea, gridSize) {
        this.gameArea = gameArea;
        this.gridSize = gridSize;
        
        // 重新绘制网格
        this.drawGrid();
        
        // 更新悬停和选择效果
        if (this.hoveredCell) {
            this.drawHoverEffect(this.hoveredCell.row, this.hoveredCell.col);
        }
        
        if (this.selectedCell) {
            this.drawSelectionEffect(this.selectedCell.row, this.selectedCell.col);
        }
    }
    
    // 销毁资源
    destroy() {
        // 清理图形对象
        if (this.gridGraphics) {
            this.gridGraphics.destroy();
        }
        if (this.hoverGraphics) {
            this.hoverGraphics.destroy();
        }
        if (this.selectionGraphics) {
            this.selectionGraphics.destroy();
        }
        
        // 清理引用
        this.scene = null;
        this.grid = null;
        this.hoveredCell = null;
        this.selectedCell = null;
    }
} 