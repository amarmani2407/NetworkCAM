/**
 * BroadcastChannel utility enabling real-time cross-tab communication between
 * the Android Phone simulator and a standalone Web Viewer running in a separate browser tab.
 */

export interface StreamChannelMessage {
  type: 'STATUS_UPDATE' | 'FRAME_DATA' | 'COMMAND';
  payload?: any;
}

export class StreamChannel {
  private static instance: BroadcastChannel | null = null;
  private static listeners: Array<(msg: StreamChannelMessage) => void> = [];

  static getChannel(): BroadcastChannel {
    if (!this.instance) {
      this.instance = new BroadcastChannel('localcam_stream_channel');
      this.instance.onmessage = (event) => {
        this.listeners.forEach((listener) => listener(event.data));
      };
    }
    return this.instance;
  }

  static subscribe(callback: (msg: StreamChannelMessage) => void): () => void {
    const channel = this.getChannel();
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  static broadcast(message: StreamChannelMessage) {
    try {
      const channel = this.getChannel();
      channel.postMessage(message);
    } catch (e) {
      // Broadcast error fallback
    }
  }
}
