import request from 'supertest'

async function resetDb() {
  const server = request('http://localhost:3000')
  const response = await server.get('/dev/access')
  await server.post('/dev/access').send({
    increment: -response.body.accesses,
  })
}

describe('Access API', () => {
  const server = request('http://localhost:3000')
  beforeAll(async () => await resetDb())
  afterAll(async () => await resetDb())

  it('Should return 200 on GET /access', async () => {
    const response = await server.get('/dev/access')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ accesses: 0 })
  })

  it('Should return 200 on POST /access', async () => {
    const response = await server.post('/dev/access').send({
      increment: 2,
    })

    expect(response.status).toBe(201)
  })

  it('Should return 200 on GET /access', async () => {
    const response = await server.get('/dev/access')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ accesses: 2 })
  })
})
