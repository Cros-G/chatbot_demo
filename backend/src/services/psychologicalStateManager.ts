import { PsychologicalState, ProgressStatus, KeyPointsUpdate } from '../types';

/**
 * 心理状态管理器 - Linus风格：简单、直接、可靠
 * 
 * 负责：
 * 1. 从system prompt初始化心理状态
 * 2. 更新关注点（覆盖+追加逻辑）
 * 3. 更新进度感
 * 4. 生成下次对话的心理状态文本
 */
export class PsychologicalStateManager {

  /**
   * 从system prompt初始化心理状态
   * 直接提取<当前心理状态>标签中的原始JSON内容
   */
  initializeFromPrompt(systemPrompt: string): PsychologicalState {
    try {
      // 提取<当前心理状态>...</当前心理状态>中的内容
      const match = systemPrompt.match(/<当前心理状态>\s*([\s\S]*?)\s*<\/当前心理状态>/i);
      if (!match || !match[1]) {
        console.warn('未找到<当前心理状态>标签，使用空状态');
        return {};
      }

      const stateContent = match[1].trim();
      
      // 直接解析为JSON数组 - 不做任何转换！
      const parsedState = this.parseRawJsonContent(stateContent);
      console.log(`成功初始化心理状态，包含 ${Array.isArray(parsedState) ? parsedState.length : Object.keys(parsedState).length} 个关注点`);
      
      return parsedState;

    } catch (error) {
      console.error('初始化心理状态失败:', error);
      return {};
    }
  }

  /**
   * 更新关注点
   * - 回应程度：覆盖式更新
   * - 回应情况总结：追加式更新（用"---\n"分隔）
   * 直接操作原始JSON对象结构
   */
  updateKeyPoints(currentState: PsychologicalState, update: KeyPointsUpdate): PsychologicalState {
    // 深拷贝当前状态
    const newState = { ...currentState };
    
    // 查找对应的关注点（关注点编号从1开始，索引从0开始）
    const targetIndex = (parseInt(update.关注点编号) - 1).toString();
    
    if (newState[targetIndex]) {
      // 更新现有关注点
      const existing = newState[targetIndex];
      newState[targetIndex] = {
        ...existing,
        回应程度: update.回应程度, // 覆盖式更新
        回应情况总结: this.appendSummary(existing.回应情况总结 || '', update.回应情况总结) // 追加式更新
      };
      console.log(`更新关注点 ${update.关注点编号}: 回应程度=${update.回应程度}`);
    } else {
      console.warn(`未找到关注点编号 ${update.关注点编号}，索引 ${targetIndex}`);
      console.log('当前状态keys:', Object.keys(newState));
    }

    return newState;
  }

  /**
   * 更新进度感
   */
  updateProgressStatus(currentState: PsychologicalState, progress: ProgressStatus): PsychologicalState {
    return {
      ...currentState,
      当前进度感: progress,
      最后更新时间: new Date().toISOString()
    };
  }

  /**
   * 生成下次对话的心理状态文本
   * 直接返回JSON字符串，用于替换system prompt中的<当前心理状态>标签
   */
  generateStateText(state: PsychologicalState): string {
    try {
      // 直接返回格式化的JSON字符串
      return JSON.stringify(state, null, 2);
    } catch (error) {
      console.error('生成心理状态文本失败:', error);
      return '{}';
    }
  }

  /**
   * 解析原始JSON内容 - 系统提示词中是6个独立的JSON对象
   * 需要将它们解析并保持原始结构
   */
  private parseRawJsonContent(content: string): PsychologicalState {
    try {
      // 尝试直接解析为JSON数组
      if (content.trim().startsWith('[')) {
        return JSON.parse(content);
      }
      
      // 系统提示词中是多个独立的JSON对象，需要解析成对象结构
      const lines = content.split('\n');
      let currentJsonStr = '';
      let braceCount = 0;
      const result: any = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        currentJsonStr += trimmedLine;
        
        // 计算大括号数量
        for (const char of trimmedLine) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        // 当大括号平衡时，说明一个JSON对象结束了
        if (braceCount === 0 && currentJsonStr.trim().startsWith('{')) {
          try {
            // 移除末尾的逗号（如果有）
            const cleanJsonStr = currentJsonStr.replace(/,\s*$/, '');
            const parsed = JSON.parse(cleanJsonStr);
            
            // 根据关注点编号作为key存储
            if (parsed.关注点编号) {
              const index = parseInt(parsed.关注点编号) - 1; // 转换为0-based索引
              result[index.toString()] = parsed;
            }
            
            currentJsonStr = '';
          } catch (parseError) {
            console.warn('解析单个JSON对象失败:', parseError);
            currentJsonStr = '';
          }
        }
      }
      
      console.log(`成功解析心理状态，包含 ${Object.keys(result).length} 个关注点`);
      return result;
      
    } catch (error) {
      console.warn('解析原始JSON内容失败:', error);
      return {};
    }
  }

  /**
   * 追加回应情况总结
   * 用"---\n"分隔新旧内容
   */
  private appendSummary(existing: string, newSummary: string): string {
    if (!existing || existing.trim() === '') {
      return newSummary;
    }
    
    if (!newSummary || newSummary.trim() === '') {
      return existing;
    }

    return existing + '---\n' + newSummary;
  }
}

// 单例导出
export const psychologicalStateManager = new PsychologicalStateManager();
