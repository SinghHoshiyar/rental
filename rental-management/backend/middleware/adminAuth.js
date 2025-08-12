const adminAuth = (req, res, next) => {
    try {
        // Check if user is authenticated (auth middleware should run first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'Authentication required'
                }
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Admin access required'
                }
            });
        }

        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ADMIN_AUTH_ERROR',
                message: 'Admin authentication error'
            }
        });
    }
};

module.exports = adminAuth;