const express = require('express');
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'TaskFlow API - Personal Task Management',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks'
    }
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaskFlow API running on port ${PORT}`);
});
