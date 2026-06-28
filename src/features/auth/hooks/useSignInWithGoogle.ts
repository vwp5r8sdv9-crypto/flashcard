import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi'

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: () => authApi.signInWithGoogle(),
  })
}
