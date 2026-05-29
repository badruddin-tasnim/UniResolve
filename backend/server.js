// server.js
// Main entry point for the UniResolve Backend Server

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();


// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// Middleware
app.use(cors()); // Allow requests from other origins (e.g. frontend if hosted separately)
app.use(express.json()); // Allow Express to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Allow parsing of URL-encoded bodies

// Serve static frontend files from the root directory
// This allows the Express server to host our HTML, CSS, and JS files directly
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure PostgreSQL connection pool using connectionString (for cloud hosting) or individual details (for local dev)
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Fallback if DATABASE_URL is not defined in .env
    user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : process.env.DB_PORT,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_DATABASE
});

// Test database connection on startup
dbPool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Database connected successfully! Time from DB:', res.rows[0].now);
    }
});

// --- API Routes ---

// Health Check Endpoint
// Useful to verify the server is running and can query the database
app.get('/api/health', async (req, res) => {
    try {
        const dbResult = await dbPool.query('SELECT NOW()');
        res.json({
            status: 'healthy',
            message: 'Server is running and database is connected.',
            dbTime: dbResult.rows[0].now
        });
    } catch (err) {
        console.error('Database query failed during health check:', err.message);
        res.status(500).json({
            status: 'unhealthy',
            error: 'Database connection failed'
        });
    }
});

// --- Authentication API Routes ---

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, roll } = req.body;

    // Simple validation
    if (!name || !email || !password || !roll) {
        return res.status(400).json({ error: 'All fields (name, email, password, student ID/roll number) are required.' });
    }

    try {
        // Check if user already exists
        const userExists = await dbPool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // Hash the password securely using bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new student user into database
        await dbPool.query(
            'INSERT INTO users (name, email, password, role, roll) VALUES ($1, $2, $3, $4, $5)',
            [name, email, hashedPassword, 'student', roll]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Forgot Password: Verify student and email a secure JWT reset link
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email, roll } = req.body;

    if (!email || !roll) {
        return res.status(400).json({ error: 'Email and Student ID/Roll Number are required.' });
    }

    try {
        const result = await dbPool.query(
            'SELECT id FROM users WHERE email = $1 AND roll = $2 AND role = $3',
            [email, roll, 'student']
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No matching student record found with these details.' });
        }

        // Generate a secure JWT reset token valid for 15 minutes
        const resetToken = jwt.sign(
            { email, roll },
            process.env.JWT_SECRET || 'uniresolve_jwt_secret_key_123',
            { expiresIn: '15m' }
        );

        const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

        const mailOptions = {
            from: `"UniResolve Support" <${process.env.SMTP_USER || 'noreply@uniresolve.com'}>`,
            to: email,
            subject: 'UniResolve Password Reset Request',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; background-color: #f8fafc; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #1d6bf3; margin: 0; font-size: 24px;">UniResolve</h1>
                        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Campus Issue Resolution System</p>
                    </div>
                    <div style="background-color: #ffffff; padding: 24px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
                        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello,</p>
                        <p style="font-size: 15px; line-height: 1.5; color: #334155;">We received a request to reset your password for your UniResolve student account associated with Roll Number <strong>${roll}</strong>.</p>
                        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Click the button below to reset your password. This link will expire in 15 minutes.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetLink}" style="background-color: #1d6bf3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(29, 107, 243, 0.2);">Reset Password</a>
                        </div>
                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    </div>
                    <div style="text-align: center; margin-top: 24px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">If the button above does not work, copy and paste this URL into your browser:</p>
                        <p style="font-size: 12px; color: #1d6bf3; word-break: break-all; margin: 8px 0 0 0;">${resetLink}</p>
                    </div>
                </div>
            `
        };

        let activeTransporter = transporter;
        let isTestAccount = false;

        if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
            try {
                // Generate an Ethereal SMTP test account on the fly
                const testAccount = await nodemailer.createTestAccount();
                activeTransporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                isTestAccount = true;
            } catch (etherealErr) {
                console.error('Failed to create Ethereal test account:', etherealErr.message);
            }
        }

        try {
            const info = await activeTransporter.sendMail(mailOptions);
            let responseMsg = 'Password reset link has been sent to your email.';
            let previewUrl = null;

            if (isTestAccount) {
                previewUrl = nodemailer.getTestMessageUrl(info);
                responseMsg = 'Password reset email sent to a virtual mailbox!';
                console.log('\n=======================================');
                console.log('ETHEREAL VIRTUAL INBOX PREVIEW URL:');
                console.log(previewUrl);
                console.log('=======================================\n');
            }

            res.json({
                success: true,
                message: responseMsg,
                emailPreviewUrl: previewUrl,
                devFallbackLink: resetLink
            });
        } catch (mailErr) {
            console.error('SMTP sending error:', mailErr.message);
            // Log fallback for local testing if SMTP config is unconfigured
            console.log('\n=======================================');
            console.log('DEVELOPMENT PASSWORD RESET LINK FALLBACK:');
            console.log(resetLink);
            console.log('=======================================\n');
            
            res.json({
                success: true,
                message: 'Failed to send email via SMTP, but the reset link has been generated for local development.',
                devFallbackLink: resetLink
            });
        }


    } catch (err) {
        console.error('Forgot password error:', err.message);
        res.status(500).json({ error: 'Server error processing password reset request.' });
    }
});

// Reset Password endpoint — verifies the JWT token and updates password
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    try {
        // Verify the JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'uniresolve_jwt_secret_key_123');
        } catch (verifyErr) {
            return res.status(400).json({ error: 'Invalid or expired password reset link. Please request a new one.' });
        }

        const { email, roll } = decoded;

        // Double-check verification in database
        const userExists = await dbPool.query(
            'SELECT id FROM users WHERE email = $1 AND roll = $2 AND role = $3',
            [email, roll, 'student']
        );

        if (userExists.rows.length === 0) {
            return res.status(400).json({ error: 'User associated with this reset link no longer exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await dbPool.query(
            'UPDATE users SET password = $1 WHERE email = $2 AND roll = $3 AND role = $4',
            [hashedPassword, email, roll, 'student']
        );

        res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ error: 'Server error resetting password.' });
    }
});


// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const userResult = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const user = userResult.rows[0];

        // Verify password using bcryptjs
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Send token and user details to frontend (excluding password hash)
        res.json({
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// Middleware function to authenticate JWT token for protected API routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = decodedUser; // Attach the decoded user information to the request
        next();
    });
}

// --- Complaints API Routes ---

// Get stats count based on roles (student vs admin)
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            // Admin stats: total, pending, in_progress, resolved
            const statsQuery = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
                FROM complaints;
            `;
            const statsResult = await dbPool.query(statsQuery);
            const stats = statsResult.rows[0];
            res.json({
                total: parseInt(stats.total) || 0,
                pending: parseInt(stats.pending) || 0,
                in_progress: parseInt(stats.in_progress) || 0,
                resolved: parseInt(stats.resolved) || 0
            });
        } else {
            // Student stats (only their own complaints): total, pending, in_progress, resolved
            const statsQuery = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
                FROM complaints
                WHERE user_id = $1;
            `;
            const statsResult = await dbPool.query(statsQuery, [req.user.id]);
            const stats = statsResult.rows[0];
            res.json({
                total: parseInt(stats.total) || 0,
                pending: parseInt(stats.pending) || 0,
                in_progress: parseInt(stats.in_progress) || 0,
                resolved: parseInt(stats.resolved) || 0
            });

        }
    } catch (err) {
        console.error('Fetch stats error:', err.message);
        res.status(500).json({ error: 'Server error fetching stats.' });
    }
});

// Submit a new complaint (student role only)
app.post('/api/complaints', authenticateToken, async (req, res) => {
    const { title, description, category } = req.body;
    
    if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required.' });
    }
    
    try {
        const insertQuery = `
            INSERT INTO complaints (title, description, category, status, user_id)
            VALUES ($1, $2, $3, 'pending', $4)
            RETURNING *;
        `;
        const result = await dbPool.query(insertQuery, [title, description, category, req.user.id]);
        res.status(201).json({
            message: 'Complaint submitted successfully!',
            complaint: result.rows[0]
        });
    } catch (err) {
        console.error('Submit complaint error:', err.message);
        res.status(500).json({ error: 'Server error submitting complaint.' });
    }
});

// Fetch list of complaints (role-based filter)
app.get('/api/complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            // Admin gets all complaints with submitting student's name
            const queryStr = `
                SELECT c.*, u.name as user
                FROM complaints c
                JOIN users u ON c.user_id = u.id
                ORDER BY c.date DESC;
            `;
            const result = await dbPool.query(queryStr);
            res.json(result.rows);
        } else {
            // Student gets only their own complaints
            const queryStr = `
                SELECT * FROM complaints
                WHERE user_id = $1
                ORDER BY date DESC;
            `;
            const result = await dbPool.query(queryStr, [req.user.id]);
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Fetch complaints error:', err.message);
        res.status(500).json({ error: 'Server error fetching complaints.' });
    }
});

// Fetch details for a specific complaint
app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
    const complaintId = req.params.id;
    
    try {
        const queryStr = `
            SELECT c.*, u.name as user, u.roll as roll, u.email as email
            FROM complaints c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1;
        `;
        const result = await dbPool.query(queryStr, [complaintId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }
        
        const complaint = result.rows[0];
        
        // Enforce student ownership check
        if (req.user.role === 'student' && complaint.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not own this complaint.' });
        }
        
        res.json(complaint);
    } catch (err) {
        console.error('Fetch complaint details error:', err.message);
        res.status(500).json({ error: 'Server error fetching complaint details.' });
    }
});

// Update complaint status (admin role only)
app.put('/api/complaints/:id/status', authenticateToken, async (req, res) => {
    // Admin check
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    
    const complaintId = complaintId => {
        // safety type checking
        return parseInt(complaintId);
    };
    const cId = parseInt(req.params.id);
    const { status, comment } = req.body;
    
    if (!status || !['pending', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (pending, in_progress, resolved) is required.' });
    }
    
    try {
        const updateQuery = `
            UPDATE complaints
            SET status = $1, admin_comment = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await dbPool.query(updateQuery, [status, comment || null, cId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }
        
        res.json({
            message: 'Complaint status updated successfully!',
            complaint: result.rows[0]
        });
    } catch (err) {
        console.error('Update complaint status error:', err.message);
        res.status(500).json({ error: 'Server error updating status.' });
    }
});

// Catch-all route to serve the Landing page (index.html) for any unmatched route
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`💻 Access the frontend at: http://localhost:${PORT}`);
});
