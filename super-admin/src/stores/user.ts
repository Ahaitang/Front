import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('super-admin-user', () => {
  const token = ref(localStorage.getItem('super_admin_token') || '')
  const username = ref(localStorage.getItem('super_admin_username') || '')
  const name = ref(localStorage.getItem('super_admin_name') || '')

  const setToken = (t: string, u: string, n: string) => {
    token.value = t
    username.value = u
    name.value = n
    localStorage.setItem('super_admin_token', t)
    localStorage.setItem('super_admin_username', u)
    localStorage.setItem('super_admin_name', n)
  }

  const clear = () => {
    token.value = ''
    username.value = ''
    name.value = ''
    localStorage.removeItem('super_admin_token')
    localStorage.removeItem('super_admin_username')
    localStorage.removeItem('super_admin_name')
  }

  return { token, username, name, setToken, clear }
})