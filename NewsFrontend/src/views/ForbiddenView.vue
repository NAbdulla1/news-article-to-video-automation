<template>
  <div class="forbidden-container">
    <n-result status="403" title="403 Forbidden" description="You do not have permission to access this page.">
      <template #footer>
        <n-button @click="$router.push('/')">Go Home</n-button>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
.forbidden-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80vh;
}
</style>
