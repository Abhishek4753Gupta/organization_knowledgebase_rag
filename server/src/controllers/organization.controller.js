import { Organization } from '../models/Organization.model.js';
import { User } from '../models/User.model.js';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function registerOrganization(req, res) {
  const { organizationName, organizationDescription, adminName, adminEmail, adminPassword } =
    req.body;

  if (!organizationName || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const slug = slugify(organizationName);
  const pineconeNamespace = `org-${slug}-${Date.now()}`;

  // Create org
  const org = await Organization.create({
    name: organizationName,
    slug,
    pineconeNamespace,
    description: organizationDescription || '',
  });

  // Create admin user
  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    organizationId: org._id,
  });

  res.status(201).json({
    message: 'Organization registered successfully',
    organization: { id: org._id, name: org.name, slug: org.slug },
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
}

export async function getOrganizationStats(req, res) {
  const org = req.user.organizationId;
  const userCount = await User.countDocuments({ organizationId: org._id });

  res.json({
    organization: {
      id: org._id,
      name: org.name,
      slug: org.slug,
      documentCount: org.documentCount,
      createdAt: org.createdAt,
    },
    userCount,
  });
}

export async function inviteUser(req, res) {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    organizationId: req.user.organizationId._id,
  });

  res.status(201).json({
    message: 'User created successfully',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function getOrgUsers(req, res) {
  const users = await User.find({ organizationId: req.user.organizationId._id }).select(
    '-password'
  );
  res.json({ users });
}

export async function toggleUserStatus(req, res) {
  const { userId } = req.params;
  const user = await User.findOne({
    _id: userId,
    organizationId: req.user.organizationId._id,
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: 'Cannot deactivate yourself' });
  }

  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
}
