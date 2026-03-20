export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: UserInfo
}

export interface UserInfo {
  id: string
  username: string
  email?: string
  avatar?: string
}
