"use client"

import { useEffect } from "react"

export function CustomerTheme() {
  useEffect(() => {
    document.body.setAttribute("data-app", "customer")
    return () => document.body.removeAttribute("data-app")
  }, [])
  return null
}
