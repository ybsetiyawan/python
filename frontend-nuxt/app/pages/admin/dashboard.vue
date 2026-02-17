<template>
  <div>
    <h1>Dashboard</h1>
  </div>
</template>
<script setup>
definePageMeta({
  layout: "admin"
})


import { useRouter } from "#imports";
import { useAuth } from "~~/app/composables/useAuth";

const router = useRouter();
const { getToken } = useAuth();

onMounted(async () => {
  

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

});
</script>

