type MessageHandler = (data: any) => void
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected') => void

/**
 * WebSocket 日志客户端封装
 * 支持自动重连、消息发送、状态管理
 */
export class LogWebSocket {
  private ws: WebSocket | null = null
  private url: string = ''
  private onMessageHandler: MessageHandler | null = null
  private onStatusChange: StatusHandler | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manualClose = false

  /**
   * 建立 WebSocket 连接
   */
  connect(token: string) {
    this.manualClose = false
    this.reconnectAttempts = 0

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    this.url = `${protocol}//${host}/ws/logs?token=${token}`

    this.doConnect()
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.manualClose = true
    this.clearReconnectTimer()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.notifyStatus('disconnected')
  }

  /**
   * 发送控制消息
   */
  send(action: string, file?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: any = { action }
      if (file) msg.file = file
      this.ws.send(JSON.stringify(msg))
    }
  }

  /**
   * 注册消息回调
   */
  onMessage(handler: MessageHandler) {
    this.onMessageHandler = handler
  }

  /**
   * 注册连接状态变化回调
   */
  onStatus(handler: StatusHandler) {
    this.onStatusChange = handler
  }

  /**
   * 获取当前连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private doConnect() {
    this.notifyStatus('connecting')

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.notifyStatus('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.onMessageHandler?.(data)
      } catch {
        // ignore non-JSON messages
      }
    }

    this.ws.onclose = () => {
      if (!this.manualClose) {
        this.notifyStatus('disconnected')
        this.tryReconnect()
      }
    }

    this.ws.onerror = () => {
      // onclose will be fired after onerror
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }
    this.reconnectAttempts++
    const delay = Math.pow(2, this.reconnectAttempts - 1) * 1000 // 1s, 2s, 4s
    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, delay)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private notifyStatus(status: 'connecting' | 'connected' | 'disconnected') {
    this.onStatusChange?.(status)
  }
}

export const logWs = new LogWebSocket()
