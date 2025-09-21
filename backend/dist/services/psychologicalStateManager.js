"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.psychologicalStateManager = exports.PsychologicalStateManager = void 0;
class PsychologicalStateManager {
    initializeFromPrompt(systemPrompt) {
        try {
            const match = systemPrompt.match(/<当前心理状态>\s*([\s\S]*?)\s*<\/当前心理状态>/i);
            if (!match || !match[1]) {
                console.warn('未找到<当前心理状态>标签，使用空状态');
                return {};
            }
            const stateContent = match[1].trim();
            const parsedState = this.parseRawJsonContent(stateContent);
            console.log(`成功初始化心理状态，包含 ${Array.isArray(parsedState) ? parsedState.length : Object.keys(parsedState).length} 个关注点`);
            return parsedState;
        }
        catch (error) {
            console.error('初始化心理状态失败:', error);
            return {};
        }
    }
    updateKeyPoints(currentState, update) {
        const newState = { ...currentState };
        const targetIndex = (parseInt(update.关注点编号) - 1).toString();
        if (newState[targetIndex]) {
            const existing = newState[targetIndex];
            newState[targetIndex] = {
                ...existing,
                回应程度: update.回应程度,
                回应情况总结: this.appendSummary(existing.回应情况总结 || '', update.回应情况总结)
            };
            console.log(`更新关注点 ${update.关注点编号}: 回应程度=${update.回应程度}`);
        }
        else {
            console.warn(`未找到关注点编号 ${update.关注点编号}，索引 ${targetIndex}`);
            console.log('当前状态keys:', Object.keys(newState));
        }
        return newState;
    }
    updateProgressStatus(currentState, progress) {
        return {
            ...currentState,
            当前进度感: progress,
            最后更新时间: new Date().toISOString()
        };
    }
    generateStateText(state) {
        try {
            return JSON.stringify(state, null, 2);
        }
        catch (error) {
            console.error('生成心理状态文本失败:', error);
            return '{}';
        }
    }
    parseRawJsonContent(content) {
        try {
            if (content.trim().startsWith('[')) {
                return JSON.parse(content);
            }
            const lines = content.split('\n');
            let currentJsonStr = '';
            let braceCount = 0;
            const result = {};
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine)
                    continue;
                currentJsonStr += trimmedLine;
                for (const char of trimmedLine) {
                    if (char === '{')
                        braceCount++;
                    if (char === '}')
                        braceCount--;
                }
                if (braceCount === 0 && currentJsonStr.trim().startsWith('{')) {
                    try {
                        const cleanJsonStr = currentJsonStr.replace(/,\s*$/, '');
                        const parsed = JSON.parse(cleanJsonStr);
                        if (parsed.关注点编号) {
                            const index = parseInt(parsed.关注点编号) - 1;
                            result[index.toString()] = parsed;
                        }
                        currentJsonStr = '';
                    }
                    catch (parseError) {
                        console.warn('解析单个JSON对象失败:', parseError);
                        currentJsonStr = '';
                    }
                }
            }
            console.log(`成功解析心理状态，包含 ${Object.keys(result).length} 个关注点`);
            return result;
        }
        catch (error) {
            console.warn('解析原始JSON内容失败:', error);
            return {};
        }
    }
    appendSummary(existing, newSummary) {
        if (!existing || existing.trim() === '') {
            return newSummary;
        }
        if (!newSummary || newSummary.trim() === '') {
            return existing;
        }
        return existing + '---\n' + newSummary;
    }
}
exports.PsychologicalStateManager = PsychologicalStateManager;
exports.psychologicalStateManager = new PsychologicalStateManager();
//# sourceMappingURL=psychologicalStateManager.js.map