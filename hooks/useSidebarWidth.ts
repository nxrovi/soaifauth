'use client'

import { useState, useEffect } from 'react'

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(256)

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10))
    }
  }, [])

  const updateSidebarWidth = (width: number) => {
    const newWidth = Math.min(Math.max(200, width), 400)
    setSidebarWidth(newWidth)
    localStorage.setItem('sidebarWidth', newWidth.toString())
  }

  return { sidebarWidth, updateSidebarWidth }
}

