import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database';
import { 
  Task, 
  TaskCreateRequest, 
  TaskRow, 
  TaskPhaseRow, 
  KeyBehaviorRow, 
  KeyPhraseRow,
  TaskPhase,
  KeyBehavior
} from '../types';
import { NotFoundError } from '../middleware/errorHandler';

class TaskService {
  async getAllTasks(): Promise<Task[]> {
    const taskRows = await db.all<TaskRow>('SELECT * FROM tasks ORDER BY created_at DESC');
    
    const tasks: Task[] = [];
    for (const taskRow of taskRows) {
      const task = await this.buildTaskFromRow(taskRow);
      tasks.push(task);
    }
    
    return tasks;
  }

  async getTaskById(id: string): Promise<Task> {
    const taskRow = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (!taskRow) {
      throw new NotFoundError('任务不存在', { taskId: id });
    }
    
    return this.buildTaskFromRow(taskRow);
  }

  async createTask(taskData: TaskCreateRequest): Promise<Task> {
    const taskId = uuidv4();
    const now = new Date().toISOString();
    
    // 创建任务
    await db.run(
      'INSERT INTO tasks (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [taskId, taskData.name, taskData.description || null, now, now]
    );
    
    // 创建阶段
    for (const phase of taskData.phases) {
      const phaseId = uuidv4();
      await db.run(
        'INSERT INTO task_phases (id, task_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
        [phaseId, taskId, phase.name, phase.order_index, now]
      );
      
      // 创建关键行为
      for (const behavior of phase.key_behaviors) {
        const behaviorId = uuidv4();
        await db.run(
          'INSERT INTO key_behaviors (id, phase_id, description, type, created_at) VALUES (?, ?, ?, ?, ?)',
          [behaviorId, phaseId, behavior.description, behavior.type, now]
        );
      }
      
      // 创建关键话术
      for (const phrase of phase.key_phrases) {
        const phraseId = uuidv4();
        await db.run(
          'INSERT INTO key_phrases (id, phase_id, phrase, created_at) VALUES (?, ?, ?, ?)',
          [phraseId, phaseId, phrase, now]
        );
      }
    }
    
    return this.getTaskById(taskId);
  }

  async updateTask(id: string, taskData: TaskCreateRequest): Promise<Task> {
    // 检查任务是否存在
    const existingTask = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      throw new NotFoundError('任务不存在', { taskId: id });
    }
    
    const now = new Date().toISOString();
    
    // 更新任务基本信息
    await db.run(
      'UPDATE tasks SET name = ?, description = ?, updated_at = ? WHERE id = ?',
      [taskData.name, taskData.description || null, now, id]
    );
    
    // 删除现有的阶段和相关数据
    await db.run('DELETE FROM key_behaviors WHERE phase_id IN (SELECT id FROM task_phases WHERE task_id = ?)', [id]);
    await db.run('DELETE FROM key_phrases WHERE phase_id IN (SELECT id FROM task_phases WHERE task_id = ?)', [id]);
    await db.run('DELETE FROM task_phases WHERE task_id = ?', [id]);
    
    // 重新创建阶段
    for (const phase of taskData.phases) {
      const phaseId = uuidv4();
      await db.run(
        'INSERT INTO task_phases (id, task_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?)',
        [phaseId, id, phase.name, phase.order_index, now]
      );
      
      // 创建关键行为
      for (const behavior of phase.key_behaviors) {
        const behaviorId = uuidv4();
        await db.run(
          'INSERT INTO key_behaviors (id, phase_id, description, type, created_at) VALUES (?, ?, ?, ?, ?)',
          [behaviorId, phaseId, behavior.description, behavior.type, now]
        );
      }
      
      // 创建关键话术
      for (const phrase of phase.key_phrases) {
        const phraseId = uuidv4();
        await db.run(
          'INSERT INTO key_phrases (id, phase_id, phrase, created_at) VALUES (?, ?, ?, ?)',
          [phraseId, phaseId, phrase, now]
        );
      }
    }
    
    return this.getTaskById(id);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      throw new NotFoundError('任务不存在', { taskId: id });
    }
    
    // 由于设置了外键约束，删除任务会级联删除相关数据
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
  }

  private async buildTaskFromRow(taskRow: TaskRow): Promise<Task> {
    // 获取阶段
    const phaseRows = await db.all<TaskPhaseRow>(
      'SELECT * FROM task_phases WHERE task_id = ? ORDER BY order_index',
      [taskRow.id]
    );
    
    const phases: TaskPhase[] = [];
    for (const phaseRow of phaseRows) {
      // 获取关键行为
      const behaviorRows = await db.all<KeyBehaviorRow>(
        'SELECT * FROM key_behaviors WHERE phase_id = ? ORDER BY created_at',
        [phaseRow.id]
      );
      
      // 获取关键话术
      const phraseRows = await db.all<KeyPhraseRow>(
        'SELECT * FROM key_phrases WHERE phase_id = ? ORDER BY created_at',
        [phaseRow.id]
      );
      
      const keyBehaviors: KeyBehavior[] = behaviorRows.map(row => ({
        id: row.id,
        phase_id: row.phase_id,
        description: row.description,
        type: row.type,
        created_at: new Date(row.created_at)
      }));
      
      const keyPhrases = phraseRows.map(row => row.phrase);
      
      phases.push({
        id: phaseRow.id,
        task_id: phaseRow.task_id,
        name: phaseRow.name,
        order_index: phaseRow.order_index,
        key_behaviors: keyBehaviors,
        key_phrases: keyPhrases,
        created_at: new Date(phaseRow.created_at)
      });
    }
    
    return {
      id: taskRow.id,
      name: taskRow.name,
      description: taskRow.description,
      phases,
      created_at: new Date(taskRow.created_at),
      updated_at: new Date(taskRow.updated_at)
    };
  }
}

export const taskService = new TaskService();
