export interface AddUserRequest {
  email: string
  username: string
  password: string
}

export interface AddUserResponse {
  email: string
  username: string
  password: string
}

export interface GetUsersResponse {
  users: Array<{
    username: string
  }>
}

export interface AuthUserRequest {
  username: string
  password: string
}

export interface AuthUserResponse {
  id: string
  username: string
  email: string
}

export interface IncrementAccessesRequest {
  increment: number
}

export interface GetAccessesResponse {
  accesses: number
}
