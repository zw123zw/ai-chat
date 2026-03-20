import request from './index'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth'
import { rsaEncrypt } from '@/utils/crypto'

export function login(data: LoginRequest): Promise<AuthResponse> {
  return request.post('/auth/login', {
    username: data.username,
    password: rsaEncrypt(data.password),
  })
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return request.post('/auth/register', {
    username: data.username,
    password: rsaEncrypt(data.password),
    email: data.email,
  })
}

export function refreshToken(token: string): Promise<{ token: string }> {
  return request.post('/auth/refresh', { refreshToken: token })
}
