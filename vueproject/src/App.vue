<template>
  <div id="app">
    <DefaultLayout>
    <Navbar v-if="showNavbar" />
    <router-view />
    </DefaultLayout>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar-c.vue'
import DefaultLayout from '@/components/DefaultLayout.vue'

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
