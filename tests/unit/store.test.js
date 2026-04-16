const store = require('../../src/data/store');

beforeEach(() => {
  store.resetStore();
});

describe('getTasks', () => {
  it('should return an empty array when store is empty', () => {
    const tasks = store.getTasks();
    expect(tasks).toEqual([]);
  });

  it('should return all tasks', () => {
    store.createTask({ title: 'Task 1' });
    store.createTask({ title: 'Task 2' });
    const tasks = store.getTasks();
    expect(tasks).toHaveLength(2);
  });
});

describe('getTaskById', () => {
  it('should return the correct task for a valid ID', () => {
    const created = store.createTask({ title: 'Find me' });
    const found = store.getTaskById(created.id);
    expect(found.title).toBe('Find me');
  });

  it('should handle string IDs via parseInt coercion', () => {
    const created = store.createTask({ title: 'String ID' });
    const found = store.getTaskById(String(created.id));
    expect(found).toBeDefined();
    expect(found.id).toBe(created.id);
  });

  it('should return undefined for a non-existent ID', () => {
    const found = store.getTaskById(999);
    expect(found).toBeUndefined();
  });

  it('should return undefined for a non-numeric string', () => {
    const found = store.getTaskById('abc');
    expect(found).toBeUndefined();
  });
});

describe('createTask', () => {
  it('should create a task with all fields and generated metadata', () => {
    const task = store.createTask({
      title: 'Test task',
      description: 'A description',
      status: 'in-progress',
      priority: 'high',
    });

    expect(task).toMatchObject({
      id: 1,
      title: 'Test task',
      description: 'A description',
      status: 'in-progress',
      priority: 'high',
    });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('should default status to pending and priority to medium', () => {
    const task = store.createTask({ title: 'Minimal task' });
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
  });

  it('should assign sequential IDs', () => {
    const task1 = store.createTask({ title: 'First' });
    const task2 = store.createTask({ title: 'Second' });
    expect(task2.id).toBe(task1.id + 1);
  });

  it('should set createdAt and updatedAt as Date instances', () => {
    const task = store.createTask({ title: 'Timestamps' });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });
});

describe('updateTask', () => {
  it('should update an existing task and return it', () => {
    const created = store.createTask({ title: 'Original' });
    const updated = store.updateTask(created.id, { title: 'Updated' });
    expect(updated.title).toBe('Updated');
  });

  it('should update updatedAt timestamp', () => {
    const created = store.createTask({ title: 'Original' });
    const originalUpdatedAt = created.updatedAt;
    const updated = store.updateTask(created.id, { title: 'Changed' });
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });

  it('should preserve unmodified fields', () => {
    const created = store.createTask({
      title: 'Original',
      description: 'Keep this',
      status: 'pending',
      priority: 'high',
    });
    const updated = store.updateTask(created.id, { title: 'New title' });
    expect(updated.description).toBe('Keep this');
    expect(updated.status).toBe('pending');
    expect(updated.priority).toBe('high');
  });

  it('should not allow overwriting id or createdAt', () => {
    const created = store.createTask({ title: 'Protected' });
    const originalId = created.id;
    const originalCreatedAt = created.createdAt;
    const updated = store.updateTask(created.id, { id: 999, createdAt: new Date('2000-01-01') });
    expect(updated.id).toBe(originalId);
    expect(updated.createdAt).toBe(originalCreatedAt);
  });

  it('should return null for a non-existent ID', () => {
    const result = store.updateTask(999, { title: 'Nope' });
    expect(result).toBeNull();
  });
});

describe('deleteTask', () => {
  it('should return true and remove the task for a valid ID', () => {
    const created = store.createTask({ title: 'Delete me' });
    const result = store.deleteTask(created.id);
    expect(result).toBe(true);
    expect(store.getTaskById(created.id)).toBeUndefined();
  });

  it('should return false for a non-existent ID', () => {
    const result = store.deleteTask(999);
    expect(result).toBe(false);
  });

  it('should remove only the target task', () => {
    store.createTask({ title: 'Keep' });
    const toDelete = store.createTask({ title: 'Delete' });
    store.createTask({ title: 'Also keep' });

    store.deleteTask(toDelete.id);
    const remaining = store.getTasks();
    expect(remaining).toHaveLength(2);
    expect(remaining.find(t => t.id === toDelete.id)).toBeUndefined();
  });
});
