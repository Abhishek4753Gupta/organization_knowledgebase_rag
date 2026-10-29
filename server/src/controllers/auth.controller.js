import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { Organization } from '../models/Organization.model.js';

function generateToken(user, org) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      orgId: org._id.toString(),
      orgNamespace: org.pineconeNamespace,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password').populate('organizationId');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user, user.organizationId);
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: {
        id: user.organizationId._id,
        name: user.organizationId.name,
        slug: user.organizationId.slug,
      },
    },
  });
}

export async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organization: {
        id: req.user.organizationId._id,
        name: req.user.organizationId.name,
        slug: req.user.organizationId.slug,
      },
    },
  });
}
