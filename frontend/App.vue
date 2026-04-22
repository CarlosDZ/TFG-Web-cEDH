<script setup>
import { onMounted } from "vue";
import { authState } from "./utils/auth";

const auth = authState();

onMounted(() => {
    auth.loadSession();
});
</script>

<template>
    <router-view v-if="!auth.sessionLoading" />
</template>
