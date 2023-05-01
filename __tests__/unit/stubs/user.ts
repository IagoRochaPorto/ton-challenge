import { AuthUserParams } from '../../functions/useCases'
import { User } from '../../functions/user'

export const addUserStub: Partial<User> = {
  username: 'any_username',
  email: 'any_email',
  password: 'any_hash',
}

export const userStub: User = {
  id: 'any_uuid',
  username: 'any_username',
  email: 'any_email',
  password: 'any_hash',
}

export const authUserStub: AuthUserParams = {
  username: 'any_username',
  password: 'any_password',
}
