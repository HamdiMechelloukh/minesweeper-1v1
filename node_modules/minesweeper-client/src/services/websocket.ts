import { ClientMessage, ServerMessage } from '../types/websocket';

class GameWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: ((event: ServerMessage) => void)[] = [];
  private openHandlers: (() => void)[] = [];
  private pendingMessages: ClientMessage[] = [];

  connect(url: string) {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      return;
    }

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      this.pendingMessages.forEach(msg => ws.send(JSON.stringify(msg)));
      this.pendingMessages = [];
      this.openHandlers.forEach(h => h());
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    };

    // Only null out this.ws if it's still THIS connection (not a newer one)
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.ws === ws) this.ws = null;
    };

    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }

  onOpen(callback: () => void) {
    this.openHandlers.push(callback);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) callback();
    return () => { this.openHandlers = this.openHandlers.filter(h => h !== callback); };
  }

  isOpen(): boolean {
    return !!(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  sendMessage(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message — will be flushed on open
      this.pendingMessages.push(message);
      console.log('WS not ready, queuing message:', message);
    }
  }

  onMessage(handler: (event: ServerMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    this.pendingMessages = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const gameSocket = new GameWebSocket();
