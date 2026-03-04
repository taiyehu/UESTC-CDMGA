<template>
  <GlobalBackground />
  <div class="relative z-10">
    <slot />
  </div>
</template>

<script setup>
import GlobalBackground from "@/components/GlobalBackground.vue"
</script>