const request = require('supertest');
const app = require('../../src/index');
const store = require('../../src/data/store');

beforeEach(() => {
  store.resetStore();
});

describe('GET /api/tasks', () => {
  it('should return 200 and an empty array when no tasks exist', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 200 and all tasks', async () => {
    store.createTask({ title: 'Task 1' });
    store.createTask({ title: 'Task 2' });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/tasks/:id', () => {
  it('should return 200 and the task for a valid ID', async () => {
    const task = store.createTask({ title: 'Find me' });
    const res = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  it('should return 404 for a non-existent ID', async () => {
    const res = await request(app).get('/api/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it('should return 404 for a non-numeric ID', async () => {
    const res = await request(app).get('/api/tasks/abc');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tasks', () => {
  it('should create a task with a valid full body and return 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'New task',
        description: 'Details',
        status: 'in-progress',
        priority: 'high',
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'New task',
      description: 'Details',
      status: 'in-progress',
      priority: 'high',
    });
    expect(res.body.id).toBeDefined();
  });

  it('should create a task with title only and apply defaults', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Minimal' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.priority).toBe('medium');
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('should return 400 when title is empty', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when title is whitespace only', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for an invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid', status: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.some(d => d.field === 'status')).toBe(true);
  });

  it('should return 400 for an invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Valid', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.some(d => d.field === 'priority')).toBe(true);
  });

  it('should strip extra fields and return 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Clean', foo: 'bar', extra: 123 });
    expect(res.status).toBe(201);
    expect(res.body.foo).toBeUndefined();
    expect(res.body.extra).toBeUndefined();
  });

  it('should return 400 when title exceeds 200 characters', async () => {
    const longTitle = 'a'.repeat(201);
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: longTitle });
    expect(res.status).toBe(400);
  });

  it('should return multiple validation errors at once', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ status: 'invalid', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update an existing task and return 200', async () => {
    const task = store.createTask({ title: 'Original' });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('should return 404 for a non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/999')
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('should return 400 for an empty body', async () => {
    const task = store.createTask({ title: 'Exists' });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should return 400 for an invalid status', async () => {
    const task = store.createTask({ title: 'Exists' });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ status: 'wrong' });
    expect(res.status).toBe(400);
  });

  it('should preserve unmodified fields on partial update', async () => {
    const task = store.createTask({
      title: 'Original',
      description: 'Keep this',
      priority: 'high',
    });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Changed' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Changed');
    expect(res.body.description).toBe('Keep this');
    expect(res.body.priority).toBe('high');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete an existing task and return 204', async () => {
    const task = store.createTask({ title: 'Delete me' });
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('should return 404 for a non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });

  it('should return 404 when GETting a deleted task', async () => {
    const task = store.createTask({ title: 'Gone soon' });
    await request(app).delete(`/api/tasks/${task.id}`);
    const res = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.status).toBe(404);
  });
});

describe('Error handling (cross-cutting)', () => {
  it('should return 400 for invalid JSON', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid json/i);
  });

  it('should return error responses with consistent shape', async () => {
    const res = await request(app).get('/api/tasks/999');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('status');
    expect(res.body.error).toHaveProperty('message');
  });
});
