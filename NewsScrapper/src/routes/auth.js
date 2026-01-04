// @ts-check
import express from 'express';
import { getKeycloakAdmin } from '../config/keycloak-admin.js';
import { registerSchema } from '../schemas/authSchema.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { ROLES } from '../enums/PermissionEnum.js';
import logger from '../logger.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    // Validate request body
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ status: 'error', error: 'Invalid input', details: JSON.parse(parseResult.error.message) });
    }

    const { username, email, password, firstName, lastName } = parseResult.data;

    try {
        const kcAdmin = await getKeycloakAdmin();

        // Check if user exists
        const existingUsers = await kcAdmin.users.find({ username });
        if (existingUsers.length > 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid input',
                details: [{ message: 'User already exists', path: ['username'] }]
            });
        }

        // Check if email exists
        const existingEmails = await kcAdmin.users.find({ email });
        if (existingEmails.length > 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid input',
                details: [{ message: 'Email already exists', path: ['email'] }]
            });
        }

        // Count total users to determine if this is the first user
        // Note: count() might not be accurate if there are service accounts, depending on keycloak version/config.
        // We will query users with a limit to guess. Or just count.
        // A safer bet: define 'admin' role name.
        const usersCount = await kcAdmin.users.count({ realm: process.env.KEYCLOAK_REALM || 'news-realm' });

        // Note: count includes service accounts? Usually checks regular users.
        // If usersCount == 0, assign admin.

        logger.info(`Creating user ${username}. Current user count: ${usersCount}`);

        const newUser = await kcAdmin.users.create({
            username,
            email,
            firstName,
            lastName,
            enabled: true,
            emailVerified: true, // Auto verify for simplicity
            credentials: [{
                type: 'password',
                value: password,
                temporary: false
            }]
        });

        // Assign Role
        const roleName = usersCount === 0 ? ROLES.ADMIN : null; // First user is admin, others have NO role (pending)

        if (roleName) {
            // Get Role ID
            const roles = await kcAdmin.roles.find({ name: roleName });
            const role = roles.find(r => r.name === roleName);
            if (role) {
                await kcAdmin.users.addRealmRoleMappings({
                    id: newUser.id,
                    roles: [{ id: role.id, name: role.name }]
                });
                logger.info(`Assigned ${roleName} role to ${username}`);
            }
        } else {
            logger.info(`User ${username} registered as PENDING (no roles).`);
        }

        res.status(201).json({ status: 'ok', message: 'User registered successfully', userId: newUser.id, role: roleName || 'pending' });

    } catch (err) {
        logger.error('Registration failed:', err);
        // Keycloak error handling
        if (err.response && err.response.data && err.response.data.errorMessage) {
            return res.status(400).json({ status: 'error', error: err.response.data.errorMessage });
        }
        res.status(500).json({ status: 'error', error: 'Registration failed' });
    }
});

router.get('/users/pending', verifyToken, requirePermission('URL.VIEW'), async (req, res) => {
    // NOTE: 'URL.VIEW' is a dummy permission check. We really want "Admin" check.
    // But strictly speaking, our plan said Admin Only. Admin has all permissions.
    // Let's use a specific check if we had one, or rely on Admin role having everything.
    // In Middleware logic, if user is admin, they pass.

    // To be safer, we could add a check:
    const userRoles = req.user.roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
        return res.status(403).json({ status: 'error', error: 'Admin access required' });
    }

    try {
        const kcAdmin = await getKeycloakAdmin();
        const users = await kcAdmin.users.find({ realm: process.env.KEYCLOAK_REALM || 'news-realm' });

        // Filter users who have NO realm roles (excluding default roles if any)
        // This is expensive if many users. Keycloak API doesn't filter by "no role".
        // We will iterate and check roles.

        const pendingUsers = [];
        for (const user of users) {
            // Skip service accounts
            if (user.username && user.username.startsWith('service-account-')) continue;

            const mappings = await kcAdmin.users.listRealmRoleMappings({ id: user.id });
            // Check for our managed roles
            const hasManagedRole = mappings.some(r => r.name === ROLES.ADMIN || r.name === ROLES.STAFF);
            if (!hasManagedRole) {
                pendingUsers.push({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                });
            }
        }

        res.status(200).json({ status: 'ok', users: pendingUsers });
    } catch (err) {
        logger.error('Failed to fetch pending users:', err);
        res.status(500).json({ status: 'error', error: 'Failed to fetch users' });
    }
});

router.post('/users/:id/approve', verifyToken, async (req, res) => {
    const userRoles = req.user.roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
        return res.status(403).json({ status: 'error', error: 'Admin access required' });
    }

    const { id } = req.params;
    const { role: requestedRole } = req.body;

    // Validate role
    const targetRole = requestedRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.STAFF;

    try {
        const kcAdmin = await getKeycloakAdmin();

        // Assign role
        const roles = await kcAdmin.roles.find({ name: targetRole });
        const role = roles.find(r => r.name === targetRole);
        if (!role) {
            throw new Error(`${targetRole} role not found in Keycloak`);
        }

        await kcAdmin.users.addRealmRoleMappings({
            id: id,
            roles: [{ id: role.id, name: role.name }]
        });

        logger.info(`User ${id} approved and assigned ${targetRole} role.`);
        res.status(200).json({ status: 'ok', message: `User approved successfully as ${targetRole}` });

    } catch (err) {
        logger.error('Failed to approve user:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

router.get('/me', verifyToken, (req, res) => {
    // req.user is populated by verifyToken from the JWT
    // We can return it directly or normalize it
    const user = {
        id: req.user.sub,
        username: req.user.preferred_username,
        email: req.user.email,
        firstName: req.user.given_name,
        lastName: req.user.family_name,
        roles: req.user.roles
    };
    res.status(200).json({ status: 'ok', user });
});

export default router;
