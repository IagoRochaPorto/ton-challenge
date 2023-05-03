import request from 'supertest'

describe('Users API', () => {
  const server = request('http://localhost:3000')

  it('Should return 201 on POST /user', async () => {
    const response = await server.post('/dev/user').send({
      username: 'john doe',
      password: 'zcDp%WDxs#j5e@B!X%hh@8',
      email: 'johndoe@email.com',
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.any(String),
      username: 'john doe',
      email: 'johndoe@email.com',
    })
  })

  it('Should return 200 on POST /auth', async () => {
    const response = await server.post('/dev/auth?password=test123').send({
      username: 'john doe',
      password: 'zcDp%WDxs#j5e@B!X%hh@8',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: expect.any(String),
      username: 'john doe',
      email: 'johndoe@email.com',
    })
  })

  it('Should return 200 on GET /user', async () => {
    const response = await server.get('/dev/user')

    expect(response.status).toBe(200)
  })
})
