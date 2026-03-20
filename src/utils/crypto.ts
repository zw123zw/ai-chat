import JSEncrypt from 'jsencrypt'
import { Base64 } from 'js-base64'

const PUBLIC_KEY = import.meta.env.VITE_RSA_PUBLIC_KEY || ''

export function rsaEncrypt(text: string): string {
  if (!PUBLIC_KEY) {
    return Base64.encode(text)
  }
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(PUBLIC_KEY)
  const encrypted = encryptor.encrypt(text)
  return encrypted || Base64.encode(text)
}

export function base64Encode(text: string): string {
  return Base64.encode(text)
}

export function base64Decode(text: string): string {
  return Base64.decode(text)
}
