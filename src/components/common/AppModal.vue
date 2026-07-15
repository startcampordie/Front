<script setup>
defineProps({
  title: { type: String, required: true },
  closeLabel: { type: String, default: '창 닫기' },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @click.self="$emit('close')">
      <section class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="`modal-${title}`">
        <header class="modal-header">
          <h2 :id="`modal-${title}`">{{ title }}</h2>
          <button type="button" :aria-label="closeLabel" @click="$emit('close')">×</button>
        </header>
        <div class="modal-body"><slot /></div>
        <footer v-if="$slots.footer" class="modal-footer"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>
