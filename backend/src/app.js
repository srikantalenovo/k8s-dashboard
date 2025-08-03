import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import k8sRoutes from './routes/k8s.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/k8s', k8sRoutes);

export default app;
