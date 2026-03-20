/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'vue-clipboard3' {
  import { Ref } from 'vue'
  export default function useClipboard(): {
    toClipboard: (text: string, container?: HTMLElement) => Promise<void>
    pasted: Ref<string>
    copied: Ref<boolean>
    isSupported: Ref<boolean>
  }
}

declare module 'typed.js' {
  interface TypedOptions {
    strings?: string[]
    stringsElement?: string | Element
    typeSpeed?: number
    startDelay?: number
    backSpeed?: number
    backDelay?: number
    loop?: boolean
    loopCount?: number
    showCursor?: boolean
    cursorChar?: string
    contentType?: string
    onComplete?: (self: Typed) => void
    onStringTyped?: (arrayPos: number, self: Typed) => void
  }
  export default class Typed {
    constructor(element: string | Element, options: TypedOptions)
    destroy(): void
    reset(restart?: boolean): void
    stop(): void
    start(): void
    toggle(): void
  }
}
