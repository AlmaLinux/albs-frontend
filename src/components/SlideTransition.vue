<!--
Taken from:
https://github.com/quasarframework/quasar/issues/4380#issuecomment-924085571
-->
<template>
  <div ref="container" style="transition: height 0.4s; overflow: hidden;">
    <div ref="content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

export default defineComponent({
  setup() {
    const content = ref()
    const container = ref()
    const resizeObserver = new ResizeObserver(() => {
      container.value.style.height = content.value.scrollHeight + 'px'
    })

    onMounted(() => {
      resizeObserver.observe(content.value)
    })
    onUnmounted(() => {
      resizeObserver.disconnect()
    })

    return {
      container,
      content,
    }
  },
})
</script>
