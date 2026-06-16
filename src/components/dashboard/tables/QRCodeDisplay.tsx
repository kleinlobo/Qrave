"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"

interface Props {
  url: string
  label: string
  size?: number
}

export default function QRCodeDisplay({ url, label, size = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    QRCode.toCanvas(canvasRef.current!, url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    })
    QRCode.toDataURL(url, { width: size, margin: 2, errorCorrectionLevel: "H" }).then(setDataUrl)
  }, [url, size])

  function downloadPng() {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `table-${label}-qr.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg border border-border" />
      <p className="text-sm font-medium text-foreground">Table {label}</p>
      <button
        onClick={downloadPng}
        disabled={!dataUrl}
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
      >
        Download PNG
      </button>
    </div>
  )
}
