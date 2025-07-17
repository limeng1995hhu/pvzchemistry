import { EventBus } from '../EventBus';
import { Building, Recycler, Reactor } from '../entities/Building';

export class BuildingPlacementSystem {
    constructor(scene, gridSystem, eventBus) {
        // 生成唯一标识符
        this.instanceId = Math.random().toString(36).substr(2, 9);
        console.log('BuildingPlacementSystem创建, ID:', this.instanceId);
        
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.eventBus = eventBus;
        
        // 拖拽状态
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        this.dragSprite = null;
        this.dragCategory = null; // 'building' | 'element'
        
        // 建筑管理
        this.buildings = new Map(); // 存储网格位置 -> 建筑实例的映射
        
        // 预览图形
        this.previewGraphics = null;
        
        // 暂停状态
        this.isPaused = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on('drag-start', (data) => {
            if (this.isPaused) return; // 暂停时忽略拖拽
            console.log(`[${this.instanceId}] 接收drag-start:`, data.type);
            this.handleDragStart(data);
        });
        
        this.eventBus.on('drag-move', (data) => {
            if (this.isPaused) return; // 暂停时忽略拖拽
            this.handleDragMove(data);
        });
        
        this.eventBus.on('drag-end', (data) => {
            if (this.isPaused) return; // 暂停时忽略拖拽
            console.log(`[${this.instanceId}] 接收drag-end`);
            this.handleDragEnd(data);
        });
        
        // 监听游戏暂停/恢复事件
        this.eventBus.on('game-pause', () => {
            this.onGamePause();
        });
        
        this.eventBus.on('game-resume', () => {
            this.onGameResume();
        });
    }

    handleDragStart(data) {
        console.log('处理拖拽开始:', data.type, '当前isDragging:', this.isDragging);
        
        // 处理建筑类型、元素类型和铲子类型
        if (!this.isBuildingType(data.type) && !this.isElementType(data.type) && !this.isShovelType(data.type)) {
            console.log('不是建筑、元素或铲子类型，忽略:', data.type);
            return;
        }
        
        this.isDragging = true;
        this.dragType = data.type;
        this.dragData = data.toolData;
        
        if (this.isBuildingType(data.type)) {
            this.dragCategory = 'building';
        } else if (this.isElementType(data.type)) {
            this.dragCategory = 'element';
        } else if (this.isShovelType(data.type)) {
            this.dragCategory = 'shovel';
        }
        
        console.log('拖拽状态设置完成，类别:', this.dragCategory, 'isDragging:', this.isDragging);
    }

    handleDragMove(data) {
        if (!this.isDragging) return;
        
        if (this.dragCategory === 'building') {
            // 建筑放置逻辑
            this.handleBuildingDragMove(data);
        } else if (this.dragCategory === 'element') {
            // 元素放置逻辑
            this.handleElementDragMove(data);
        } else if (this.dragCategory === 'shovel') {
            // 铲子移除逻辑
            this.handleShovelDragMove(data);
        }
    }

    handleDragEnd(data) {
        console.log('处理拖拽结束，isDragging:', this.isDragging, '类别:', this.dragCategory);
        
        if (!this.isDragging) {
            console.log('当前不在拖拽状态，忽略拖拽结束');
            return;
        }
        
        if (this.dragCategory === 'building') {
            // 建筑放置逻辑
            this.handleBuildingDragEnd(data);
        } else if (this.dragCategory === 'element') {
            // 元素放置逻辑
            this.handleElementDragEnd(data);
        } else if (this.dragCategory === 'shovel') {
            // 铲子移除逻辑
            this.handleShovelDragEnd(data);
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
        // 检查网格边界
        if (!this.gridSystem.isValidCell(row, col)) {
            return false;
        }
        
        // 检查该位置是否已被占用
        if (this.gridSystem.isOccupied(row, col)) {
            return false;
        }
        
        // 只检查能量是否足够，不扣除
        if (this.scene.hud && !this.scene.hud.canAfford(this.dragData.price)) {
            return false;
        }
        
        return true;
    }

    placeBuilding(row, col) {
        console.log('开始放置建筑:', this.dragType, 'at', row, col);
        
        try {
            // 在成功放置时才消耗能量
            if (this.scene.hud && !this.scene.hud.spendEnergy(this.dragData.price)) {
                if (this.scene.hud) {
                    this.scene.hud.showMessage('能量不足！', '#ff0000');
                }
                return;
            }
            
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
        
        if (!screenPos) {
            console.error('无法获取屏幕位置');
            return null;
        }
        
        let building;
        const config = {
            size: this.gridSystem.cellSize * 0.8, // 建筑大小稍小于网格
            showHealthBar: false
        };
        
        if (type === 'recycler') {
            building = new Recycler(this.scene, screenPos.x, screenPos.y, config);
        } else if (type === 'reactor') {
            building = new Reactor(this.scene, screenPos.x, screenPos.y, config);
        }
        
        if (building) {
            // 设置网格位置
            building.setGridPosition(row, col);
            console.log('建筑实例创建成功');
        } else {
            console.error('建筑实例创建失败');
        }
        
        return building;
    }

    cleanupDrag() {
        // 清除网格预览
        this.clearGridPreview();
        
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        
        console.log('拖拽状态清理完成');
    }
    
    // 处理建筑拖拽移动
    handleBuildingDragMove(data) {
        // 检查是否在有效的网格位置，并发送网格预览事件
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos && this.canPlaceBuilding(gridPos.row, gridPos.col)) {
            // 显示绿色网格预览
            this.showGridPreview(gridPos.row, gridPos.col, true);
        } else {
            // 显示红色网格预览或清除预览
            if (gridPos) {
                this.showGridPreview(gridPos.row, gridPos.col, false);
            } else {
                this.clearGridPreview();
            }
        }
    }

    // 处理元素拖拽移动
    handleElementDragMove(data) {
        // 检查是否悬停在建筑上
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos) {
            const building = this.getBuildingAt(gridPos.row, gridPos.col);
            if (building && this.canAddElementToBuilding(building, this.dragData)) {
                // 显示绿色预览 - 可以添加元素
                this.showBuildingHighlight(gridPos.row, gridPos.col, true);
            } else if (building) {
                // 显示红色预览 - 建筑存在但不能添加
                this.showBuildingHighlight(gridPos.row, gridPos.col, false);
            } else {
                // 清除预览 - 没有建筑
                this.clearGridPreview();
            }
        } else {
            this.clearGridPreview();
        }
    }

    // 处理建筑拖拽结束
    handleBuildingDragEnd(data) {
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos && this.canPlaceBuilding(gridPos.row, gridPos.col)) {
            console.log('放置建筑:', this.dragType, '在位置:', gridPos.row, gridPos.col);
            this.placeBuilding(gridPos.row, gridPos.col);
        } else {
            console.log('无法放置建筑');
            if (this.scene.hud) {
                this.scene.hud.showMessage('无法在此位置放置建筑', '#ff0000');
            }
        }
    }

    // 处理元素拖拽结束
    handleElementDragEnd(data) {
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos) {
            const building = this.getBuildingAt(gridPos.row, gridPos.col);
            if (building && this.canAddElementToBuilding(building, this.dragData)) {
                console.log('添加元素', this.dragData.name, '到建筑:', building.type);
                this.addElementToBuilding(building, this.dragData);
            } else {
                console.log('无法添加元素到此位置');
                if (this.scene.hud) {
                    this.scene.hud.showMessage('无法在此位置添加元素', '#ff0000');
                }
            }
        }
    }

    // 检查是否是元素类型
    isElementType(type) {
        return ['hydrogen', 'oxygen', 'carbon', 'nitrogen'].includes(type);
    }

    // 检查是否可以将元素添加到建筑
    canAddElementToBuilding(building, elementData) {
        // 检查能量是否足够
        if (this.scene.hud && !this.scene.hud.canAfford(elementData.price)) {
            return false;
        }
        
        // 回收器：可以设置目标物质
        if (building.type === 'recycler') {
            return !building.targetSubstance; // 只有未设置目标时才能添加
        }
        
        // 反应器：可以添加元素
        if (building.type === 'reactor') {
            return building.elements.length < building.maxElements;
        }
        
        return false;
    }

    // 将元素添加到建筑
    addElementToBuilding(building, elementData) {
        try {
            // 消耗能量
            if (this.scene.hud && !this.scene.hud.spendEnergy(elementData.price)) {
                if (this.scene.hud) {
                    this.scene.hud.showMessage('能量不足！', '#ff0000');
                }
                return;
            }
            
            if (building.type === 'recycler') {
                // 将道具栏元素ID映射到化学数据库ID
                const substanceId = this.mapElementToSubstance(elementData.id);

                // 设置回收器的目标物质
                building.setTargetSubstance(substanceId);
                console.log('回收器目标设置为:', substanceId, '(来自元素:', elementData.name, ')');

                if (this.scene.hud) {
                    this.scene.hud.showMessage(`回收器目标设置为${elementData.name}！(-${elementData.price}⚡)`, '#4ecdc4');
                }
            } else if (building.type === 'reactor') {
                // 将道具栏元素ID映射到化学数据库ID
                const substanceId = this.mapElementToSubstance(elementData.id);

                // 向反应器添加元素
                const result = building.addElement(substanceId);

                if (this.scene.hud) {
                    const color = result.success ? '#4ecdc4' : '#ff0000';
                    this.scene.hud.showMessage(result.message, color);
                }

                console.log('反应器添加元素:', substanceId, '结果:', result);
            } else if (building.type === 'reactor') {
                // 添加元素到反应器
                building.addElement(elementData.symbol);
                console.log('反应器添加元素:', elementData.symbol);
                
                if (this.scene.hud) {
                    this.scene.hud.showMessage(`反应器添加${elementData.name}！(-${elementData.price}⚡)`, '#4ecdc4');
                }
            }
        } catch (error) {
            console.error('添加元素到建筑时出错:', error);
            // 如果出错，退还能量
            if (this.scene.hud) {
                this.scene.hud.addEnergy(elementData.price);
            }
        }
    }

    // 显示建筑高亮
    showBuildingHighlight(row, col, canAdd) {
        // 复用网格预览逻辑
        this.showGridPreview(row, col, canAdd);
    }

    // 处理铲子拖拽移动
    handleShovelDragMove(data) {
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos) {
            const building = this.getBuildingAt(gridPos.row, gridPos.col);
            if (building) {
                // 显示红色高亮 - 表示将要移除
                this.showBuildingHighlightForRemoval(gridPos.row, gridPos.col);
            } else {
                // 没有建筑可移除
                this.clearGridPreview();
            }
        } else {
            this.clearGridPreview();
        }
    }

    // 处理铲子拖拽结束
    handleShovelDragEnd(data) {
        const gridPos = this.gridSystem.screenToGrid(data.x, data.y);
        
        if (gridPos) {
            const building = this.getBuildingAt(gridPos.row, gridPos.col);
            if (building) {
                console.log('移除建筑:', building.type, '在位置:', gridPos.row, gridPos.col);
                this.removeBuildingAt(gridPos.row, gridPos.col);
                
                if (this.scene.hud) {
                    this.scene.hud.showMessage(`${building.type}已移除`, '#ff6b6b');
                }
            } else {
                console.log('此位置没有建筑可移除');
                if (this.scene.hud) {
                    this.scene.hud.showMessage('此位置没有建筑可移除', '#ff0000');
                }
            }
        }
    }

    // 显示建筑移除高亮
    showBuildingHighlightForRemoval(row, col) {
        // 如果没有预览图形对象，创建一个
        if (!this.previewGraphics) {
            this.previewGraphics = this.scene.add.graphics();
            this.previewGraphics.setDepth(5);
        }
        
        this.previewGraphics.clear();
        
        // 获取网格单元的屏幕位置和大小
        const screenPos = this.gridSystem.gridToScreen(row, col);
        const cellSize = this.gridSystem.cellSize;
        
        // 红色预览 - 表示将要移除
        this.previewGraphics.lineStyle(3, 0xff0000, 0.8);
        this.previewGraphics.fillStyle(0xff0000, 0.3);
        
        const size = cellSize * 0.9;
        const x = screenPos.x - size / 2;
        const y = screenPos.y - size / 2;
        
        this.previewGraphics.fillRect(x, y, size, size);
        this.previewGraphics.strokeRect(x, y, size, size);
    }

    // 移除指定位置的建筑
    removeBuildingAt(row, col) {
        const success = this.removeBuilding(row, col);
        if (!success) {
            console.warn('移除建筑失败:', row, col);
        }
        return success;
    }

    // 检查是否是建筑类型
    isBuildingType(type) {
        return type === 'recycler' || type === 'reactor';
    }
    
    // 检查是否是铲子类型
    isShovelType(type) {
        return type === 'shovel';
    }

    // 将道具栏元素ID映射到化学数据库物质ID
    mapElementToSubstance(elementId) {
        const elementToSubstanceMap = {
            'hydrogen': 'H2',
            'oxygen': 'O2',
            'carbon': 'C',
            'nitrogen': 'N2'
        };

        return elementToSubstanceMap[elementId] || elementId;
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
    
    // 游戏暂停处理
    onGamePause() {
        this.isPaused = true;
        
        // 取消当前拖拽操作
        if (this.isDragging) {
            this.endDrag();
        }
        
        console.log('BuildingPlacementSystem: 游戏已暂停');
    }
    
    // 游戏恢复处理
    onGameResume() {
        this.isPaused = false;
        console.log('BuildingPlacementSystem: 游戏已恢复');
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