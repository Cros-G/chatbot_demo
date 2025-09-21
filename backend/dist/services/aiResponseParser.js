"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiResponseParser = exports.AIResponseParser = void 0;
class AIResponseParser {
    parseResponse(aiResponse) {
        const result = {
            progressStatus: null,
            keyPointsUpdate: null,
            response: null,
            isValid: false,
            rawContent: aiResponse
        };
        try {
            result.progressStatus = this.extractProgressStatus(aiResponse);
            result.keyPointsUpdate = this.extractKeyPointsUpdate(aiResponse);
            result.response = this.extractResponse(aiResponse);
            if (!result.response && aiResponse.trim().length > 0) {
                const hasXMLTags = /<(progress_status|key_points_update|response)>/i.test(aiResponse);
                if (!hasXMLTags) {
                    console.warn('AI回复未使用XML格式，使用整个回复作为response内容');
                    result.response = aiResponse.trim();
                }
                else {
                    console.warn('AI回复包含XML标签但缺少<response>，使用整个回复作为response内容');
                    result.response = aiResponse.trim();
                }
            }
            result.isValid = (result.response !== null && result.response.trim().length > 0) ||
                (result.keyPointsUpdate !== null);
        }
        catch (error) {
            console.error('AI回复解析失败:', error);
            result.isValid = false;
        }
        return result;
    }
    extractProgressStatus(content) {
        const match = content.match(/<progress_status>\s*([\s\S]*?)\s*<\/progress_status>/i);
        if (!match || !match[1])
            return null;
        try {
            const jsonContent = this.extractJsonFromContent(match[1]);
            if (!jsonContent)
                return null;
            const parsed = JSON.parse(jsonContent);
            if (parsed['当前状态编号'] && parsed['当前状态名称']) {
                return {
                    当前状态编号: parsed['当前状态编号'],
                    当前状态名称: parsed['当前状态名称']
                };
            }
        }
        catch (error) {
            console.warn('解析progress_status失败:', error);
        }
        return null;
    }
    extractKeyPointsUpdate(content) {
        const match = content.match(/<key_points_update>\s*([\s\S]*?)\s*<\/key_points_update>/i);
        if (!match || !match[1])
            return null;
        try {
            const jsonContent = this.extractJsonFromContent(match[1]);
            if (!jsonContent)
                return null;
            const parsed = JSON.parse(jsonContent);
            if (parsed['关注点编号'] && parsed['关注点描述']) {
                return {
                    关注点编号: parsed['关注点编号'],
                    关注点描述: parsed['关注点描述'],
                    回应程度: parsed['回应程度'] || '',
                    回应情况总结: parsed['回应情况总结'] || ''
                };
            }
        }
        catch (error) {
            console.warn('解析key_points_update失败:', error);
        }
        return null;
    }
    extractResponse(content) {
        const completeMatch = content.match(/<response>\s*([\s\S]*?)\s*<\/response>/i);
        if (completeMatch && completeMatch[1]) {
            return completeMatch[1].trim();
        }
        const openTagMatch = content.match(/<response>\s*([\s\S]*?)$/i);
        if (openTagMatch && openTagMatch[1]) {
            const responseContent = openTagMatch[1].trim();
            if (responseContent.length > 0) {
                console.warn('检测到未关闭的<response>标签，使用容错模式提取内容');
                return responseContent;
            }
        }
        return null;
    }
    extractJsonFromContent(content) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
        if (jsonMatch && jsonMatch[1]) {
            return jsonMatch[1].trim();
        }
        const trimmed = content.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return trimmed;
        }
        return null;
    }
}
exports.AIResponseParser = AIResponseParser;
exports.aiResponseParser = new AIResponseParser();
//# sourceMappingURL=aiResponseParser.js.map