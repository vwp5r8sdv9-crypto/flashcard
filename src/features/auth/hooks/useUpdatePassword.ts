import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => authApi.updatePassword(newPassword),
  })
}
