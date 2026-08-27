<template>
  <a-breadcrumb>
    <a-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
      <span v-if="index === breadcrumbs.length - 1" class="current">
        {{ item.title }}
      </span>
      <a-link v-else @click="handleClick(item.path)">
        {{ item.title }}
      </a-link>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface BreadcrumbItem {
  title: string
  path: string
}

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  const matched = route.matched

  matched.forEach((record) => {
    if (record.meta?.title) {
      items.push({
        title: record.meta.title as string,
        path: record.path,
      })
    }
  })

  return items
})

const handleClick = (path: string) => {
  if (path && path !== route.path) {
    router.push(path)
  }
}
</script>

<style scoped lang="scss">
.current {
  color: var(--color-neutral-10);
  font-weight: 500;
}
</style>
