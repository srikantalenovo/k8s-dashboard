import express from 'express';
import { 
    getAdminDashboard,
    adminAction1,
    adminAction2 
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';

const router = express.Router();

// Admin dashboard route
router.get('/dashboard',
    authenticate,
    checkPermission('admin', 'access'),
    getAdminDashboard
);

// Example protected admin action
router.post('/action1',
    authenticate,
    checkPermission('admin', 'manage'),
    adminAction1
);

// Another protected action
router.delete('/action2/:id',
    authenticate,
    checkPermission('admin', 'delete'),
    adminAction2
);

export default router;