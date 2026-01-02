import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { PERMISSIONS } from '../enums/PermissionEnum.js';
import logger from '../logger.js';

const client = jwksClient({
    jwksUri: `${process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080'}/realms/${process.env.KEYCLOAK_REALM || 'news-realm'}/protocol/openid-connect/certs`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            return callback(err);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

// Role to Permission Mapping
const ROLE_PERMISSIONS = {
    'admin': [
        PERMISSIONS.URL_VIEW,
        PERMISSIONS.URL_DELETE,
        PERMISSIONS.URL_PROCESS,
        PERMISSIONS.SCRAPPING_STATUS_VIEW,
        PERMISSIONS.SCRAPPING_STATUS_MODIFY
    ],
    'staff': [
        PERMISSIONS.URL_VIEW,
        PERMISSIONS.SCRAPPING_STATUS_VIEW
    ]
};

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ status: 'error', error: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', error: 'Invalid authorization format' });
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            logger.error('Token verification failed:', err.message);
            return res.status(401).json({ status: 'error', error: 'Invalid token' });
        }
        req.user = decoded;
        req.user.roles = decoded.realm_access?.roles || [];
        next();
    });
};

export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', error: 'Not authenticated' });
        }

        const userRoles = req.user.roles;
        // Check if any of the user's roles grant the required permission
        const hasPermission = userRoles.some(role => {
            const allowed = ROLE_PERMISSIONS[role];
            return allowed && allowed.includes(permission);
        });

        if (!hasPermission) {
             // Admins should technically have everything, assuming 'admin' role covers it in mapping above.
             // If implicit admin access is desired:
             // if (userRoles.includes('admin')) return next();
             
             logger.warn(`User ${req.user.preferred_username} denied access. Required: ${permission}`);
             return res.status(403).json({ status: 'error', error: 'Insufficient permissions' });
        }

        next();
    };
};
