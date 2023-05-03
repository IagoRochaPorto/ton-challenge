import request from 'supertest'
import crypto from 'node:crypto'

describe('Users API', () => {
  const server = request('http://localhost:3000')
  const username = crypto.randomBytes(20).toString('hex')

  it('Should return 201 on POST /user', async () => {
    const response = await server.post('/dev/user').send({
      username,
      password: 'zcDp%WDxs#j5e@B!X%hh@8',
      email: 'johndoe@email.com',
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.any(String),
      username,
      email: 'johndoe@email.com',
    })
  })

  it('Should return 200 on POST /auth', async () => {
    const response = await server.post('/dev/auth?password=test123').send({
      username,
      password: 'zcDp%WDxs#j5e@B!X%hh@8',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: expect.any(String),
      username,
      email: 'johndoe@email.com',
    })
  })

  it('Should return 200 on GET /user', async () => {
    const response = await server.get('/dev/user')

    expect(response.status).toBe(200)
  })

  it('Should return 400 on POST /user if user already exists', async () => {
    const response = await server.post('/dev/user').send({
      username,
      password: 'zcDp%WDxs#j5e@B!X%hh@8',
      email: 'johndoe@email.com',
    })
    expect(response.status).toBe(400)
  })
})
