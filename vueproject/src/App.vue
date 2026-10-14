<template>
  <div id="app">
    <DefaultLayout>
    <Navbar v-if="showNavbar" />
    <VisualEffectsToggle v-else class="fixed right-4 top-4 z-50" />
    <router-view />
    </DefaultLayout>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import DefaultLayout from '@/components/DefaultLayout.vue'
import VisualEffectsToggle from '@/components/VisualEffectsToggle.vue'

const route = useRoute()

const showNavbar = computed(() => {
  const noNavRoutes = ['/login', '/register']
  return !noNavRoutes.includes(route.path)
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--color-text-primary);
  margin-top: 60px;
}
</style>
