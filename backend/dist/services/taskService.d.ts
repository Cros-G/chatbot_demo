import { Task, TaskCreateRequest } from '../types';
declare class TaskService {
    getAllTasks(): Promise<Task[]>;
    getTaskById(id: string): Promise<Task>;
    createTask(taskData: TaskCreateRequest): Promise<Task>;
    updateTask(id: string, taskData: TaskCreateRequest): Promise<Task>;
    deleteTask(id: string): Promise<void>;
    private buildTaskFromRow;
}
export declare const taskService: TaskService;
export {};
//# sourceMappingURL=taskService.d.ts.map