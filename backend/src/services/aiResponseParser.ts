import { ParsedAIResponse, ProgressStatus, KeyPointsUpdate } from '../types';

/**
 * AI回复解析器 - Linus风格：简单、直接、可靠
 * 
 * 解析AI回复中的三段式结构：
 * <progress_status>...</progress_status>
 * <key_points_update>...</key_points_update>
 * <response>...</response>
 */
export class AIResponseParser {
  
  /**
   * 解析AI回复
   * @param aiResponse AI的原始回复
   * @returns 解析结果
   */
  parseResponse(aiResponse: string): ParsedAIResponse {
    const result: ParsedAIResponse = {
      progressStatus: null,
      keyPointsUpdate: null,
      response: null,
      isValid: false,
      rawContent: aiResponse
    };

    try {
      // 解析progress_status
      result.progressStatus = this.extractProgressStatus(aiResponse);
      
      // 解析key_points_update
      result.keyPointsUpdate = this.extractKeyPointsUpdate(aiResponse);
      
      // 解析response
      result.response = this.extractResponse(aiResponse);
      
      // 增强的容错逻辑
      if (!result.response && aiResponse.trim().length > 0) {
        // 检查是否有任何XML标签
        const hasXMLTags = /<(progress_status|key_points_update|response)>/i.test(aiResponse);
        
        if (!hasXMLTags) {
          // 完全没有XML标签，使用整个回复作为response
          console.warn('AI回复未使用XML格式，使用整个回复作为response内容');
          result.response = aiResponse.trim();
        } else {
          // 有XML标签但没有response标签，这是不完整的输出
          console.warn('AI回复包含XML标签但缺少<response>，使用整个回复作为response内容');
          result.response = aiResponse.trim();
        }
      }
      
      // 放宽验证条件：只要有response内容或者有key_points_update就认为有效
      result.isValid = (result.response !== null && result.response.trim().length > 0) || 
                       (result.keyPointsUpdate !== null);
      
    } catch (error) {
      console.error('AI回复解析失败:', error);
      result.isValid = false;
    }

    return result;
  }

  /**
   * 提取进度状态
   */
  private extractProgressStatus(content: string): ProgressStatus | null {
    const match = content.match(/<progress_status>\s*([\s\S]*?)\s*<\/progress_status>/i);
    if (!match || !match[1]) return null;

    try {
      const jsonContent = this.extractJsonFromContent(match[1]);
      if (!jsonContent) return null;

      const parsed = JSON.parse(jsonContent);
      
      // 验证必要字段
      if (parsed['当前状态编号'] && parsed['当前状态名称']) {
        return {
          当前状态编号: parsed['当前状态编号'],
          当前状态名称: parsed['当前状态名称']
        };
      }
    } catch (error) {
      console.warn('解析progress_status失败:', error);
    }

    return null;
  }

  /**
   * 提取关注点更新
   */
  private extractKeyPointsUpdate(content: string): KeyPointsUpdate | null {
    const match = content.match(/<key_points_update>\s*([\s\S]*?)\s*<\/key_points_update>/i);
    if (!match || !match[1]) return null;

    try {
      const jsonContent = this.extractJsonFromContent(match[1]);
      if (!jsonContent) return null;

      const parsed = JSON.parse(jsonContent);
      
      // 验证必要字段
      if (parsed['关注点编号'] && parsed['关注点描述']) {
        return {
          关注点编号: parsed['关注点编号'],
          关注点描述: parsed['关注点描述'],
          回应程度: parsed['回应程度'] || '',
          回应情况总结: parsed['回应情况总结'] || ''
        };
      }
    } catch (error) {
      console.warn('解析key_points_update失败:', error);
    }

    return null;
  }

  /**
   * 提取回复内容
   * 支持容错：如果没有</response>结束标签，则提取<response>之后的所有内容
   */
  private extractResponse(content: string): string | null {
    // 首先尝试匹配完整的<response>...</response>标签
    const completeMatch = content.match(/<response>\s*([\s\S]*?)\s*<\/response>/i);
    if (completeMatch && completeMatch[1]) {
      return completeMatch[1].trim();
    }

    // 如果没有完整匹配，尝试匹配只有开始标签的情况
    const openTagMatch = content.match(/<response>\s*([\s\S]*?)$/i);
    if (openTagMatch && openTagMatch[1]) {
      const responseContent = openTagMatch[1].trim();
      // 确保内容不为空
      if (responseContent.length > 0) {
        console.warn('检测到未关闭的<response>标签，使用容错模式提取内容');
        return responseContent;
      }
    }

    return null;
  }

  /**
   * 从内容中提取JSON - 处理```json```包裹的情况
   */
  private extractJsonFromContent(content: string): string | null {
    // 先尝试提取```json```包裹的内容
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }

    // 如果没有```json```包裹，尝试直接解析
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    return null;
  }
}

// 单例导出 - Linus风格：简单直接
export const aiResponseParser = new AIResponseParser();
