export class CSVParser {
    static parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            data.push(row);
        }
        
        return data;
    }
    
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    // 解析复杂字段
    static parseComplexField(field, type) {
        if (!field) return [];
        
        switch (type) {
            case 'array':
                return field.split(',').map(item => item.trim());
                
            case 'keyvalue':
                // 解析 "key1:value1;key2:value2" 格式
                const pairs = field.split(';');
                const result = {};
                pairs.forEach(pair => {
                    const [key, value] = pair.split(':');
                    if (key && value) {
                        result[key.trim()] = value.trim();
                    }
                });
                return result;
                
            case 'objectives':
                // 解析目标 "type:param1:param2"
                return field.split(',').map(obj => {
                    const parts = obj.split(':');
                    return {
                        type: parts[0],
                        param1: parts[1],
                        param2: parts[2],
                        param3: parts[3]
                    };
                });
                
            case 'waves':
                // 解析敌人波次 "wave1:time:enemy:state:count:interval:lane"
                return field.split(';').map(wave => {
                    const enemies = wave.split(',').map(enemyStr => {
                        const parts = enemyStr.split(':');
                        return {
                            waveId: parts[0],
                            startTime: parseInt(parts[1]) || 0,
                            substance: parts[2],
                            state: parts[3],
                            count: parseInt(parts[4]) || 1,
                            interval: parseInt(parts[5]) || 2000,
                            lane: parts[6]
                        };
                    });
                    return enemies;
                }).flat();
                
            default:
                return field;
        }
    }
}