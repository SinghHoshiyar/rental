const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Model', () => {
    const validUserData = {
        email: 'test@example.com',
        password: 'password123',
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890'
        }
    };

    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser.email).toBe(validUserData.email);
            expect(savedUser.profile.firstName).toBe(validUserData.profile.firstName);
            expect(savedUser.role).toBe('customer'); // default role
            expect(savedUser.isActive).toBe(true);
        });

        it('should hash password before saving', async () => {
            const user = new User(validUserData);
            await user.save();

            expect(user.password).not.toBe(validUserData.password);
            expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
        });

        it('should require email', async () => {
            const user = new User({ ...validUserData, email: undefined });

            await expect(user.save()).rejects.toThrow('Email is required');
        });

        it('should require password', async () => {
            const user = new User({ ...validUserData, password: undefined });

            await expect(user.save()).rejects.toThrow('Password is required');
        });

        it('should validate email format', async () => {
            const user = new User({ ...validUserData, email: 'invalid-email' });

            await expect(user.save()).rejects.toThrow('Please enter a valid email');
        });

        it('should enforce unique email', async () => {
            await new User(validUserData).save();
            const duplicateUser = new User(validUserData);

            await expect(duplicateUser.save()).rejects.toThrow();
        });
    });

    describe('User Methods', () => {
        let user;

        beforeEach(async () => {
            user = new User(validUserData);
            await user.save();
        });

        it('should compare password correctly', async () => {
            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        it('should generate auth token', () => {
            process.env.JWT_SECRET = 'test-secret';
            const token = user.generateAuthToken();

            expect(token).toBeDefined();
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(user._id.toString());
            expect(decoded.email).toBe(user.email);
        });

        it('should generate password reset token', () => {
            const resetToken = user.generatePasswordResetToken();

            expect(resetToken).toBeDefined();
            expect(user.passwordResetToken).toBeDefined();
            expect(user.passwordResetExpires).toBeDefined();
            expect(user.passwordResetExpires).toBeInstanceOf(Date);
        });
    });

    describe('User Statics', () => {
        beforeEach(async () => {
            const user = new User(validUserData);
            await user.save();
        });

        it('should find user by credentials', async () => {
            const foundUser = await User.findByCredentials('test@example.com', 'password123');

            expect(foundUser).toBeDefined();
            expect(foundUser.email).toBe('test@example.com');
            expect(foundUser.lastLogin).toBeDefined();
        });

        it('should throw error for invalid credentials', async () => {
            await expect(
                User.findByCredentials('test@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid credentials');

            await expect(
                User.findByCredentials('wrong@example.com', 'password123')
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('User Virtuals', () => {
        it('should return full name virtual', async () => {
            const user = new User(validUserData);
            await user.save();

            expect(user.profile.fullName).toBe('John Doe');
        });
    });

    describe('User JSON Transform', () => {
        it('should not include sensitive fields in JSON', async () => {
            const user = new User(validUserData);
            await user.save();

            const userJSON = user.toJSON();

            expect(userJSON.password).toBeUndefined();
            expect(userJSON.passwordResetToken).toBeUndefined();
            expect(userJSON.passwordResetExpires).toBeUndefined();
        });
    });
});