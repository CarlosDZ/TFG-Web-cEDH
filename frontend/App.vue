<script setup>
import { onMounted } from "vue";
import { authState } from "./utils/auth";

const auth = authState();

onMounted(() => {
    console.log("App montada → haciendo intento de carga de sesion");
    auth.loadSession();
});
</script>

<template>
    <router-view />
</template>
