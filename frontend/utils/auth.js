import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const authState = defineStore("auth", () => {
    const isLogged = ref(false);
    const user = ref(null);

    console.log("Session store cargado:", isLogged.value, user.value);

    async function loadSession() {
        console.log("loadSession() ejecutado en store:", isLogged.value, user.value);
        try {
            const res = await axios.get(`/api/session`, {
                withCredentials: true,
            });
            if (res.data.session.authenticated) {
                user.value = res.data.session.user;
                isLogged.value = true;
            }
        } catch (err) {
            user.value = null;
            isLogged.value = false;
        }
    }

    function setUser(cookieUser) {
        user.value = cookieUser;
        isLogged.value = true;
    }

    function logout() {
        user.value = null;
        isLogged.value = false;
    }

    return { isLogged, user, setUser, logout, loadSession };
});
