import ConfirmModal from '~/components/ConfirmModal.vue'
import type { Component } from 'vue'

type ConfirmModalType = 'default' | 'delete' | 'error' | 'warn' | 'info'

export interface ConfirmModalOptions {
  type?: ConfirmModalType
  title: string
  description?: string
  bodyComponent?: Component | null
  bodyProps?: Record<string, unknown> | null
}

/** 将弹窗状态收进 Nuxt UI Overlay；返回 true 表示确认，false 表示取消。 */
export function useConfirmModal() {
  const overlay = useOverlay()
  let active = false

  async function confirm(options: ConfirmModalOptions): Promise<boolean> {
    if (active) return false
    active = true
    const modal = overlay.create(ConfirmModal, { destroyOnClose: true })
    try {
      const opened = modal.open({
        type: options.type ?? 'default',
        title: options.title,
        description: options.description ?? '',
        pending: false,
        bodyComponent: options.bodyComponent,
        bodyProps: options.bodyProps,
        onConfirm: () => modal.close(true),
      })
      return Boolean(await opened)
    } finally {
      active = false
    }
  }

  return { confirm }
}
