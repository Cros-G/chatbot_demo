export interface Task {
    id: string;
    name: string;
    description?: string;
    phases: TaskPhase[];
    created_at: Date;
    updated_at: Date;
}
export interface TaskPhase {
    id: string;
    task_id: string;
    name: string;
    order_index: number;
    key_behaviors: KeyBehavior[];
    key_phrases: string[];
    created_at: Date;
}
export interface KeyBehavior {
    id: string;
    phase_id: string;
    description: string;
    type: 'positive' | 'negative';
    created_at: Date;
}
export interface Role {
    id: string;
    name: string;
    personality: string;
    speaking_style: string;
    background: string;
    created_at: Date;
    updated_at: Date;
}
export interface Template {
    id: string;
    name: string;
    task_id: string;
    role_id: string;
    description?: string;
    task?: Task;
    role?: Role;
    created_at: Date;
    updated_at: Date;
}
export interface Conversation {
    id: string;
    name: string;
    task_id?: string;
    role_id?: string;
    template_id?: string;
    status: 'active' | 'completed';
    messages: Message[];
    task?: Task;
    role?: Role;
    template?: Template;
    created_at: Date;
    updated_at: Date;
}
export interface Message {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}
export interface Prompt {
    id: string;
    name: string;
    category: 'system' | 'coach' | 'evaluation';
    template: string;
    version: number;
    is_active: boolean;
    variables: string[];
    created_at: Date;
    updated_at: Date;
}
export interface SystemSettings {
    id: string;
    memory_window_size: number;
    evaluation_enabled: boolean;
    updated_at: Date;
}
export interface TaskCreateRequest {
    name: string;
    description?: string;
    phases: TaskPhaseInput[];
}
export interface TaskPhaseInput {
    name: string;
    order_index: number;
    key_behaviors: KeyBehaviorInput[];
    key_phrases: string[];
}
export interface KeyBehaviorInput {
    description: string;
    type: 'positive' | 'negative';
}
export interface RoleCreateRequest {
    name: string;
    personality: string;
    speaking_style: string;
    background: string;
}
export interface TemplateCreateRequest {
    name: string;
    task_id: string;
    role_id: string;
    description?: string;
}
export interface ConversationCreateRequest {
    name: string;
    task_id?: string;
    role_id?: string;
    template_id?: string;
}
export interface MessageCreateRequest {
    role: 'user' | 'assistant';
    content: string;
}
export interface PromptUpdateRequest {
    template: string;
    variables?: string[];
}
export interface SystemSettingsUpdateRequest {
    memory_window_size?: number;
    evaluation_enabled?: boolean;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface TaskRow {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}
export interface TaskPhaseRow {
    id: string;
    task_id: string;
    name: string;
    order_index: number;
    created_at: string;
}
export interface KeyBehaviorRow {
    id: string;
    phase_id: string;
    description: string;
    type: 'positive' | 'negative';
    created_at: string;
}
export interface KeyPhraseRow {
    id: string;
    phase_id: string;
    phrase: string;
    created_at: string;
}
export interface RoleRow {
    id: string;
    name: string;
    personality: string;
    speaking_style: string;
    background: string;
    created_at: string;
    updated_at: string;
}
export interface TemplateRow {
    id: string;
    name: string;
    task_id: string;
    role_id: string;
    description?: string;
    created_at: string;
    updated_at: string;
}
export interface ConversationRow {
    id: string;
    name: string;
    task_id?: string;
    role_id?: string;
    template_id?: string;
    status: 'active' | 'completed';
    created_at: string;
    updated_at: string;
}
export interface MessageRow {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export interface PromptRow {
    id: string;
    name: string;
    category: 'system' | 'coach' | 'evaluation';
    template: string;
    version: number;
    is_active: number;
    variables?: string;
    created_at: string;
    updated_at: string;
}
export interface SystemSettingsRow {
    id: string;
    memory_window_size: number;
    evaluation_enabled: number;
    updated_at: string;
}
//# sourceMappingURL=index.d.ts.map