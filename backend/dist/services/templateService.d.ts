import { Template, TemplateCreateRequest } from '../types';
declare class TemplateService {
    getAllTemplates(): Promise<Template[]>;
    getTemplateById(id: string): Promise<Template>;
    createTemplate(templateData: TemplateCreateRequest): Promise<Template>;
    updateTemplate(id: string, templateData: TemplateCreateRequest): Promise<Template>;
    deleteTemplate(id: string): Promise<void>;
    private buildTemplateFromRow;
}
export declare const templateService: TemplateService;
export {};
//# sourceMappingURL=templateService.d.ts.map