import { Router } from 'express';
import {
  registerOrganization,
  getOrganizationStats,
  inviteUser,
  getOrgUsers,
  toggleUserStatus,
} from '../controllers/organization.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public: Register a new organization (and its first admin)
router.post('/register', registerOrganization);

// Protected admin-only routes
router.get('/stats', authenticate, getOrganizationStats);
router.post('/users', authenticate, requireAdmin, inviteUser);
router.get('/users', authenticate, requireAdmin, getOrgUsers);
router.patch('/users/:userId/toggle', authenticate, requireAdmin, toggleUserStatus);

export default router;
