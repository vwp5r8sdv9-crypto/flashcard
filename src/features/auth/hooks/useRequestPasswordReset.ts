import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
  })
}
