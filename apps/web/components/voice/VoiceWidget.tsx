"use client"

import * as React from "react"
import { Mic, MicOff, PhoneOff, PhoneCall, Volume2 } from "lucide-react"

interface ChatMessage {
  role: 'ai' | 'user' | 'status'
  text: string
}

export function VoiceWidget({ configId }: { configId: string }) {
  const [isCalling, setIsCalling] = React.useState(false)
  const [ws, setWs] = React.useState<WebSocket | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const chatEndRef = React.useRef<HTMLDivElement>(null)
  const audioQueueRef = React.useRef<string[]>([])
  const isPlayingRef = React.useRef(false)
  const cleanupRef = React.useRef<(() => void) | null>(null)
  // Persist audio element across renders
  const audioElRef = React.useRef<HTMLAudioElement | null>(null)

  // Create audio element once on mount (not via JSX to avoid re-mount issues)
  React.useEffect(() => {
    const audio = new Audio()
    audio.addEventListener('ended', () => {
      if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src)
      isPlayingRef.current = false
      playNext()
    })
    audio.addEventListener('error', () => {
      // Only treat as error if we were actually trying to play something
      if (audio.src && !audio.src.startsWith('about:')) {
        console.warn("Audio playback error, skipping to next")
        isPlayingRef.current = false
        playNext()
      }
    })
    audioElRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const addMessage = React.useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  function playNext() {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    const b64 = audioQueueRef.current.shift()!
    isPlayingRef.current = true
    try {
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = audioElRef.current!
      audio.src = url
      audio.play().then(() => console.log("▶ Audio playing")).catch(e => {
        console.error("Play blocked:", e)
        isPlayingRef.current = false
        URL.revokeObjectURL(url)
        playNext()
      })
    } catch (e) {
      console.error("Decode error:", e)
      isPlayingRef.current = false
      playNext()
    }
  }

  const startCall = async () => {
    setMessages([{ role: 'status', text: 'Connecting...' }])
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } 
      })
      
      // Unlock audio on user gesture with minimal silent audio
      const audio = audioElRef.current!
      const silentCtx = new AudioContext()
      const silentBuf = silentCtx.createBuffer(1, 1, 22050)
      const silentSource = silentCtx.createBufferSource()
      silentSource.buffer = silentBuf
      silentSource.connect(silentCtx.destination)
      silentSource.start()
      silentCtx.close().catch(() => {})
      
      addMessage({ role: 'status', text: 'Microphone ready.' })
      
      const socket = new WebSocket(`ws://localhost:3001/voice/stream?configId=${configId}`)
      socket.binaryType = 'arraybuffer'
      
      socket.onopen = () => {
        setIsCalling(true)
        addMessage({ role: 'status', text: 'Connected.' })
        
        const audioContext = new AudioContext()
        const actualSampleRate = audioContext.sampleRate
        
        const source = audioContext.createMediaStreamSource(stream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        
        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            const float32 = e.inputBuffer.getChannelData(0)
            const ratio = actualSampleRate / 16000
            const targetLength = Math.floor(float32.length / ratio)
            const int16 = new Int16Array(targetLength)
            for (let i = 0; i < targetLength; i++) {
              const s = Math.max(-1, Math.min(1, float32[Math.floor(i * ratio)]))
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }
            socket.send(int16.buffer)
          }
        }
        
        source.connect(processor)
        processor.connect(audioContext.destination)
        
        cleanupRef.current = () => {
          source.disconnect()
          processor.disconnect()
          audioContext.close().catch(() => {})
          stream.getTracks().forEach(t => t.stop())
        }
      }

      socket.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)
            
            if (data.type === 'transcript') {
              addMessage({ role: 'user', text: data.text })
            } else if (data.type === 'ai_response') {
              addMessage({ role: 'ai', text: data.text })
            } else if (data.type === 'audio') {
              audioQueueRef.current.push(data.audioBase64)
              playNext()
            } else if (data.type === 'status') {
              addMessage({ role: 'status', text: data.text })
            }
          }
        } catch (e) {
          console.error("WS parse error:", e)
        }
      }

      socket.onclose = () => {
        addMessage({ role: 'status', text: 'Call ended.' })
        doCleanup()
      }

      socket.onerror = () => {
        addMessage({ role: 'status', text: 'Connection error.' })
      }

      setWs(socket)
    } catch (err) {
      console.error("Error starting voice call:", err)
      alert("Microphone access is required for voice calls.")
    }
  }

  const doCleanup = () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
    setIsCalling(false)
    setWs(null)
    audioQueueRef.current = []
    isPlayingRef.current = false
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.src = '' }
  }

  const endCall = () => { if (ws) ws.close(); doCleanup() }

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-secondary-200">
      <div className="mb-6 relative">
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isCalling ? 'bg-green-100 animate-ping scale-150' : 'bg-secondary-100'}`} />
        <div className={`relative h-20 w-20 rounded-full flex items-center justify-center text-white ${isCalling ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-primary shadow-md'}`}>
          {isCalling ? <Mic className="h-8 w-8 animate-pulse" /> : <MicOff className="h-8 w-8" />}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-secondary-900 mb-2">
        {isCalling ? "AI is listening..." : "Ready to speak"}
      </h3>
      
      {isCalling && (
        <div className="w-full max-w-md bg-secondary-50 rounded-lg p-4 mb-6 text-left border border-secondary-100 shadow-inner h-52 overflow-y-auto flex flex-col gap-2">
          {messages.map((msg, i) => (
            <div key={i} className={
              msg.role === 'ai' ? 'bg-white p-3 rounded-lg border border-primary/20 self-start max-w-[90%] shadow-sm' :
              msg.role === 'user' ? 'bg-primary p-3 rounded-lg text-white self-end max-w-[90%] shadow-sm' :
              'text-center text-xs text-secondary-400 italic py-1'
            }>
              {msg.role === 'ai' && <p className="text-xs font-bold text-primary mb-1">🔊 AI Assistant</p>}
              {msg.role === 'user' && <p className="text-xs font-bold text-primary-200 mb-1">You</p>}
              <p className={`text-sm ${msg.role === 'status' ? '' : msg.role === 'user' ? '' : 'text-secondary-800'}`}>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {!isCalling && (
        <p className="text-secondary-500 text-center text-sm mb-6 max-w-xs">
          Click the button below to start a voice conversation with the AI.
        </p>
      )}

      <button
        onClick={isCalling ? endCall : startCall}
        className={`flex items-center space-x-2 px-8 py-3 rounded-full font-semibold transition-all ${
          isCalling 
            ? 'bg-error text-white hover:bg-error-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
            : 'bg-primary text-white hover:bg-primary-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
        }`}
      >
        {isCalling ? <PhoneOff className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
        <span>{isCalling ? "End Call" : "Start Call"}</span>
      </button>
    </div>
  )
}
