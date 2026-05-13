<template>
  <v-app>
    <v-main class="app-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-main {
  --v-layout-left: 0px;
  --v-layout-top: 0px;
}
</style>
