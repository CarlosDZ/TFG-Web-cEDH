<script setup>
import { computed, ref, onMounted } from "vue";
const svgBackground = ref("");
const svgBorder = ref("");
onMounted(() => {
    const styles = getComputedStyle(document.documentElement);
    svgBackground.value = styles.getPropertyValue("--like-svg-background").trim();
    svgBorder.value = styles.getPropertyValue("--like-svg-border").trim();
});

const props = defineProps({
    discusionElement: {
        type: Object,
        required: true,
    },
});
import avatar from "../../assets/images/avatar.jpg";
const image_url = avatar;

const titulo = computed(() => props.discusionElement.title);
const autor = computed(() => props.discusionElement.authorId.username);
const likes = computed(() => props.discusionElement.likes);
const fechaFormateada = computed(() => new Date(props.discusionElement.createdAt).toLocaleString());
const body = computed(() => props.discusionElement.markdown_text);
</script>

<template>
    <article class="discusion">
        <div class="header-div">
            <img :src="image_url" alt="avatar" />
            <div class="vertical-container">
                <h2>{{ titulo }}</h2>
                <p class="author">Por {{ autor }} · {{ fechaFormateada }}</p>
            </div>
        </div>
        <p class="main-body">{{ body }}</p>
        <div>
            <button class="like-btn">
                <svg
                    id="likeBttn"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width="48px"
                    height="48px"
                >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
                            stroke-width="0.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        ></path>
                    </g>
                </svg>
            </button>
            <h3>{{ likes }}</h3>
        </div>
    </article>
</template>
