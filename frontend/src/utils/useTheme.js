import { useState, useEffect } from 'react'

const STORAGE_KEY = 'givago_theme'

/**
 * Hook de tema claro/escuro.
 *
 * Prioridade:
 *   1. Preferência manual salva no localStorage
 *   2. Preferência do sistema operacional (prefers-color-scheme)
 *
 * Aplica/remove a classe .dark no <html> (estratégia do Tailwind).
 * Escuta mudanças de preferência do sistema em tempo real —
 * se o usuário trocar o tema do iPhone de claro para escuro,
 * o app atualiza automaticamente (a menos que haja override manual).
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo !== null) return salvo === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Aplica a classe .dark no <html> sempre que o tema mudar
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Acompanha mudança de preferência do sistema em tempo real
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      // Só atualiza se o usuário não definiu uma preferência manual
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setIsDark(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Alterna manualmente e salva a preferência
  const alternar = () => {
    const novo = !isDark
    localStorage.setItem(STORAGE_KEY, novo ? 'dark' : 'light')
    setIsDark(novo)
  }

  return { isDark, alternar }
}
