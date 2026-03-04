<template>
  <GlobalBackground />
  <div class="relative z-10">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import GlobalBackground from "@/components/GlobalBackground.vue"
</script>