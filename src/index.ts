import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import databaseRoutes from './routes/databaseRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', databaseRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Management System API' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
