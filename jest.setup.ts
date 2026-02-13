import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)
Object.assign(global, { TextEncoder, TextDecoder })

if (typeof global.MessageChannel === 'undefined') {
    // Basic Mock for MessageChannel if worker_threads not available or overkill
    const { MessageChannel } = require('worker_threads');
    global.MessageChannel = MessageChannel;
}

if (typeof global.BroadcastChannel === 'undefined') {
    global.BroadcastChannel = class BroadcastChannel {
        name: string;
        constructor(name: string) { this.name = name; }
        postMessage(message: any) { }
        addEventListener(event: string, listener: Function) { }
        removeEventListener(event: string, listener: Function) { }
        close() { }
        onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;
        onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;
        dispatchEvent(event: Event): boolean { return true; }
    };
}
