const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Routes', () => {
    const validUserData = {
        email: 'test@example.com',
        password: 'password123',
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890'
        }
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validUserData.email);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('should not register user with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...validUserData, email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should not register user with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...validUserData, password: '123' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should not register duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            // Second registration with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const user = new User(validUserData);
            await user.save();
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUserData.email,
                    password: validUserData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validUserData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: validUserData.email,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('LOGIN_FAILED');
        });

        it('should not login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: validUserData.password
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('LOGIN_FAILED');
        });
    });

    describe('GET /api/auth/profile', () => {
        let user, token;

        beforeEach(async () => {
            user = new User(validUserData);
            await user.save();
            token = user.generateAuthToken();
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validUserData.email);
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        it('should not get profile with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_TOKEN');
        });
    });

    describe('PUT /api/auth/profile', () => {
        let user, token;

        beforeEach(async () => {
            user = new User(validUserData);
            await user.save();
            token = user.generateAuthToken();
        });

        it('should update user profile', async () => {
            const updateData = {
                profile: {
                    firstName: 'Jane',
                    lastName: 'Smith'
                }
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.profile.firstName).toBe('Jane');
            expect(response.body.data.user.profile.lastName).toBe('Smith');
        });

        it('should not update with invalid data', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    profile: {
                        firstName: '' // Empty first name
                    }
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
});