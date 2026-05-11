import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const authState = defineStore("auth", () => {
  const isLogged = ref(false);
  const user = ref(null);
  const sessionLoading = ref(true);

  async function loadSession() {
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
    } finally {
      sessionLoading.value = false;
    }
  }

  function setUser(cookieUser) {
    user.value = cookieUser;
    isLogged.value = true;
  }

  async function logout() {
    try {
      await axios.post(`/api/auth/logout`, null, { withCredentials: true });
    } catch (err) {
      // ignoramos errores de red: limpiamos el estado igualmente
    }
    user.value = null;
    isLogged.value = false;
  }

  return { isLogged, user, sessionLoading, setUser, logout, loadSession };
});
