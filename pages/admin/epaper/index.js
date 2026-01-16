import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function EPaperIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/epaper/upload')
  }, [router])
  return null
}
