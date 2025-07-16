import { EventBus } from '../EventBus';
import { Building, Recycler, Reactor } from '../entities/Building';

export class BuildingPlacementSystem {
    constructor(scene, gridSystem, eventBus) {
        console.log('BuildingPlacementSystem - 构造函数开始');
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.eventBus = eventBus;
        
        // 拖拽状态
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        this.dragSprite = null;
        
        // 建筑管理
        this.buildings = new Map(); // 存储网格位置 -> 建筑实例的映射
        
        // 预览图形
        this.previewGraphics = null;
        
        this.setupEventListeners();
        console.log('BuildingPlacementSystem - 构造完成');
    }

    setupEventListeners() {
        console.log('BuildingPlacementSystem - 设置事件监听器');
        
        this.eventBus.on('drag-start', (data) => {
            console.log('BuildingPlacementSystem - 接收到drag-start事件:', data);
            this.handleDragStart(data);
        });
        
        this.eventBus.on('drag-move', (data) => {
            console.log('BuildingPlacementSystem - 接收到drag-move事件:', data);
            this.handleDragMove(data);
        });
        
        this.eventBus.on('drag-end', (data) => {
            console.log('BuildingPlacementSystem - 接收到drag-end事件:', data);
            this.handleDragEnd(data);
        });
        
        console.log('BuildingPlacementSystem - 事件监听器设置完成');
    }

    handleDragStart(data) {
        console.log('BuildingPlacementSystem - 处理拖拽开始:', data.type);
        
        // 只处理建筑类型
        if (!this.isBuildingType(data.type)) {
            console.log('不是建筑类型，忽略:', data.type);
            return;
        }
        
        this.isDragging = true;
        this.dragType = data.type;
        this.dragData = data.toolData;
        
        // 不再创建拖拽预览，InventoryPanel已经处理了
        console.log('建筑拖拽开始，等待放置');
    }

    handleDragMove(data) {
        if (!this.isDragging) return;
        
        console.log('BuildingPlacementSystem - 处理拖拽移动:', data.x, data.y);
        
        // 检查是否在有效的网格位置，并发送网格预览事件
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        console.log('当前网格位置:', gridPos);
        
        if (gridPos && this.canPlaceBuilding(gridPos.row, gridPos.col)) {
            console.log('可以放置在网格:', gridPos.row, gridPos.col);
            // 显示绿色网格预览
            this.showGridPreview(gridPos.row, gridPos.col, true);
        } else {
            console.log('不能放置在当前位置');
            // 显示红色网格预览或清除预览
            if (gridPos) {
                this.showGridPreview(gridPos.row, gridPos.col, false);
            } else {
                this.clearGridPreview();
            }
        }
    }

    handleDragEnd(data) {
        console.log('BuildingPlacementSystem - 处理拖拽结束:', data.x, data.y);
        
        if (!this.isDragging) {
            console.log('当前不在拖拽状态，忽略拖拽结束');
            return;
        }
        
        // 检查是否可以在此位置放置建筑
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        console.log('拖拽结束时的网格位置:', gridPos);
        
        if (gridPos && this.canPlaceBuilding(gridPos.row, gridPos.col)) {
            console.log('尝试放置建筑:', this.dragType, '在位置:', gridPos.row, gridPos.col);
            this.placeBuilding(gridPos.row, gridPos.col);
        } else {
            console.log('无法放置建筑，位置无效或已占用');
            // 显示放置失败消息
            if (this.scene.hud) {
                this.scene.hud.showMessage('无法在此位置放置建筑', '#ff0000');
            }
        }
        
        // 清理拖拽状态
        this.cleanupDrag();
    }

    // 显示网格放置预览
    showGridPreview(row, col, canPlace) {
        // 如果没有预览图形对象，创建一个
        if (!this.previewGraphics) {
            this.previewGraphics = this.scene.add.graphics();
            this.previewGraphics.setDepth(5); // 在网格上方，但在拖拽预览下方
        }
        
        this.previewGraphics.clear();
        
        // 获取网格单元的屏幕位置和大小
        const screenPos = this.gridSystem.gridToScreen(row, col);
        const cellSize = this.gridSystem.cellSize;
        
        if (canPlace) {
            // 绿色预览 - 可以放置
            this.previewGraphics.lineStyle(3, 0x00ff00, 0.8);
            this.previewGraphics.fillStyle(0x00ff00, 0.2);
        } else {
            // 红色预览 - 无法放置
            this.previewGraphics.lineStyle(3, 0xff0000, 0.8);
            this.previewGraphics.fillStyle(0xff0000, 0.2);
        }
        
        const size = cellSize * 0.9; // 稍小一点显示边距
        const x = screenPos.x - size / 2;
        const y = screenPos.y - size / 2;
        
        this.previewGraphics.fillRect(x, y, size, size);
        this.previewGraphics.strokeRect(x, y, size, size);
    }
    
    // 清除网格预览
    clearGridPreview() {
        if (this.previewGraphics) {
            this.previewGraphics.clear();
        }
    }

    createDragPreview(x, y) {
        // 移除这个方法，因为InventoryPanel已经处理拖拽预览
        console.log('BuildingPlacementSystem不再创建拖拽预览');
    }

    canPlaceBuilding(row, col) {
        console.log('检查是否可以放置建筑 at:', row, col);
        
        // 检查网格边界
        if (!this.gridSystem.isValidCell(row, col)) {
            console.log('位置超出网格边界');
            return false;
        }
        
        // 检查该位置是否已被占用
        if (this.gridSystem.isOccupied(row, col)) {
            console.log('位置已被占用');
            return false;
        }
        
        // 只检查能量是否足够，不扣除
        if (this.scene.hud && !this.scene.hud.canAfford(this.dragData.price)) {
            console.log('能量不足');
            return false;
        }
        
        console.log('可以放置建筑');
        return true;
    }

    placeBuilding(row, col) {
        console.log('放置建筑:', this.dragType, 'at', row, col);
        
        try {
            // 在成功放置时才消耗能量
            if (this.scene.hud && !this.scene.hud.spendEnergy(this.dragData.price)) {
                console.log('能量不足，无法放置建筑');
                if (this.scene.hud) {
                    this.scene.hud.showMessage('能量不足！', '#ff0000');
                }
                return;
            }
            
            console.log('消耗能量:', this.dragData.price);
            
            // 创建建筑实例
            const building = this.createBuildingInstance(this.dragType, row, col);
            if (!building) {
                console.error('创建建筑实例失败');
                // 如果建筑创建失败，退还能量
                if (this.scene.hud) {
                    this.scene.hud.addEnergy(this.dragData.price);
                }
                return;
            }
            
            // 将建筑添加到场景和管理系统
            this.buildings.set(`${row},${col}`, building);
            this.gridSystem.setOccupied(row, col, building);
            
            console.log('建筑放置成功');
            
            // 显示成功消息
            if (this.scene.hud) {
                this.scene.hud.showMessage(`${this.dragData.name} 建造成功！(-${this.dragData.price}⚡)`, '#4ecdc4');
            }
        } catch (error) {
            console.error('放置建筑时出错:', error);
            // 如果出错，退还能量
            if (this.scene.hud) {
                this.scene.hud.addEnergy(this.dragData.price);
            }
        }
    }

    createBuildingInstance(type, row, col) {
        console.log('创建建筑实例:', type, 'at', row, col);
        
        const screenPos = this.gridSystem.gridToScreen(row, col);
        console.log('建筑屏幕位置:', screenPos);
        
        let building;
        
        if (type === 'recycler') {
            building = new Recycler(this.scene, screenPos.x, screenPos.y, row, col);
        } else if (type === 'reactor') {
            building = new Reactor(this.scene, screenPos.x, screenPos.y, row, col);
        }
        
        if (building) {
            console.log('建筑实例创建成功');
        } else {
            console.error('建筑实例创建失败');
        }
        
        return building;
    }

    cleanupDrag() {
        console.log('清理拖拽状态');
        
        // 清除网格预览
        this.clearGridPreview();
        
        // 不再处理dragSprite和dragText，因为InventoryPanel处理拖拽预览
        
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        
        console.log('拖拽状态清理完成');
    }
    
    // 检查是否是建筑类型
    isBuildingType(type) {
        return type === 'recycler' || type === 'reactor';
    }
    
    // 更新系统（在GamePlay的update中调用）
    update(time, delta) {
        // 更新拖拽文本位置
        if (this.isDragging && this.dragSprite && this.dragText) {
            this.dragText.setPosition(this.dragSprite.x, this.dragSprite.y);
        }
        
        // 更新所有建筑
        this.buildings.forEach(building => {
            if (building.update) {
                building.update(time, delta);
            }
        });
    }
    
    // 获取指定位置的建筑
    getBuildingAt(row, col) {
        return this.buildings.get(`${row},${col}`);
    }
    
    // 移除建筑
    removeBuilding(row, col) {
        const key = `${row},${col}`;
        const building = this.buildings.get(key);
        
        if (building) {
            building.destroy();
            this.buildings.delete(key);
            this.gridSystem.clearOccupied(row, col);
            return true;
        }
        
        return false;
    }
    
    // 响应式布局更新
    resize(width, height) {
        // 更新所有建筑的位置
        this.buildings.forEach((building, key) => {
            const [row, col] = key.split(',').map(Number);
            const screenPos = this.gridSystem.gridToScreen(row, col);
            building.setPosition(screenPos.x, screenPos.y);
        });
    }
    
    // 销毁系统
    destroy() {
        // 清理所有建筑
        this.buildings.forEach(building => building.destroy());
        this.buildings.clear();
        
        // 清理图形对象
        if (this.dragSprite) {
            this.dragSprite.destroy();
        }
        if (this.dragText) {
            this.dragText.destroy();
        }
        
        // 清理拖拽状态
        this.cleanupDrag();
        
        // 清理事件监听器
        EventBus.off('drag-start');
        EventBus.off('drag-move');
        EventBus.off('drag-end');
        EventBus.off('grid-cell-hover');
    }
} 