<script setup>
import { computed } from "vue";

const props = defineProps({
    discusionElement: {
        type: Object,
        required: true,
    },
});

const titulo = computed(() => props.discusionElement.title);
const autor = computed(() => props.discusionElement.authorId.username);
const likes = computed(() => props.discusionElement.likes);
const fechaFormateada = computed(() => new Date(props.discusionElement.createdAt).toLocaleString());
const body = computed(() => props.discusionElement.markdown_text);

</script>

<template>
    <article class="discusion">
        <h2>{{ titulo }}</h2>
        <p>Por {{ autor }} · {{ fechaFormateada }}</p>
        <p>{{ body }}</p>
        <p>Likes: {{ likes }}</p>
    </article>
</template>

<style scoped>
.discusion {
    padding: 1rem;
    border-bottom: 1px solid #ddd;
}
</style>
