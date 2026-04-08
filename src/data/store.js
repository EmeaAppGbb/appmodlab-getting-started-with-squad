let tasks = [
  {
    id: 1,
    title: "Migrate authentication to OAuth2",
    description: "Replace legacy session-based auth with OAuth2 protocol for better security and scalability",
    status: "in-progress",
    priority: "high",
    createdAt: new Date("2024-01-15T08:00:00Z"),
    updatedAt: new Date("2024-01-20T14:30:00Z")
  },
  {
    id: 2,
    title: "Refactor payment gateway integration",
    description: "Modernize payment processing to support multiple providers and improve error handling",
    status: "pending",
    priority: "high",
    createdAt: new Date("2024-01-16T09:15:00Z"),
    updatedAt: new Date("2024-01-16T09:15:00Z")
  },
  {
    id: 3,
    title: "Implement real-time notification system",
    description: "Add WebSocket support for push notifications to enhance user engagement",
    status: "pending",
    priority: "medium",
    createdAt: new Date("2024-01-17T10:30:00Z"),
    updatedAt: new Date("2024-01-17T10:30:00Z")
  },
  {
    id: 4,
    title: "Optimize database query performance",
    description: "Review and optimize slow-running queries identified in production monitoring",
    status: "completed",
    priority: "medium",
    createdAt: new Date("2024-01-10T07:00:00Z"),
    updatedAt: new Date("2024-01-18T16:45:00Z")
  },
  {
    id: 5,
    title: "Update API documentation",
    description: "Generate OpenAPI specs and update developer portal with latest endpoint changes",
    status: "pending",
    priority: "low",
    createdAt: new Date("2024-01-18T11:00:00Z"),
    updatedAt: new Date("2024-01-18T11:00:00Z")
  }
];

let nextId = 6;

module.exports = {
  getTasks: () => tasks,
  getTaskById: (id) => tasks.find(t => t.id === parseInt(id)),
  createTask: (taskData) => {
    const newTask = {
      id: nextId++,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || "pending",
      priority: taskData.priority || "medium",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    tasks.push(newTask);
    return newTask;
  },
  updateTask: (id, taskData) => {
    const index = tasks.findIndex(t => t.id === parseInt(id));
    if (index === -1) return null;
    
    tasks[index] = {
      ...tasks[index],
      ...taskData,
      id: tasks[index].id,
      createdAt: tasks[index].createdAt,
      updatedAt: new Date()
    };
    return tasks[index];
  },
  deleteTask: (id) => {
    const index = tasks.findIndex(t => t.id === parseInt(id));
    if (index === -1) return false;
    
    tasks.splice(index, 1);
    return true;
  }
};
