import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('foodbela_token') || null,
  user: JSON.parse(localStorage.getItem('foodbela_user') || 'null'),

  setAuth: (token, user) => {
    localStorage.setItem('foodbela_token', token)
    localStorage.setItem('foodbela_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('foodbela_token')
    localStorage.removeItem('foodbela_user')
    set({ token: null, user: null })
  },

  updateUser: (user) => {
    localStorage.setItem('foodbela_user', JSON.stringify(user))
    set({ user })
  }
}))

export default useAuthStore
