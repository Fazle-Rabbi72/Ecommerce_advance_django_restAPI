import { useEffect, useState } from 'react'
import { setUser } from '../utils/auth'

const MainWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const handler = async () => {
      try {
        await setUser()
      } catch (err) {
        console.error("Auth initialization error:", err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    handler()
    return () => {
      isMounted = false
    }
  }, [])

  return loading ? null : children
}

export default MainWrapper
