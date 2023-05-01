import { AuthUserParams } from '../../../../functions/userLambda/useCases'
import { User } from '../../../../functions/userLambda/user'

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
