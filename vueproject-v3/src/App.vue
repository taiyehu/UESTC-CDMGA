<template>
  <div id="app">
    <Navbar v-if="showNavbar" />
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

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
  color: #2c3e50;
  margin-top: 60px;
}
</style>
