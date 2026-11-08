import { watchEffect, type Directive } from 'vue'
import type { PermissionRequirement } from '../utils/permission'

export default defineNuxtPlugin(nuxtApp => {
	const { hasPermission } = usePermission()
	const effects = new WeakMap<
		HTMLElement,
		{ stop: () => void; originalDisplay: string; requirement: Ref<PermissionRequirement> }
	>()

	const directive: Directive<HTMLElement, PermissionRequirement> = {
		mounted(element, binding) {
			const requirement = shallowRef(binding.value)
			const originalDisplay = element.style.display
			const stop = watchEffect(() => {
				const allowed = hasPermission(requirement.value)
				element.hidden = !allowed
				element.style.display = allowed ? originalDisplay : 'none'
			})
			effects.set(element, { stop, originalDisplay, requirement })
		},
		updated(element, binding) {
			const effect = effects.get(element)
			if (effect) effect.requirement.value = binding.value
		},
		unmounted(element) {
			effects.get(element)?.stop()
			effects.delete(element)
		},
		getSSRProps(binding) {
			return hasPermission(binding.value) ? {} : { hidden: true }
		},
	}

	nuxtApp.vueApp.directive('permission', directive)
})
