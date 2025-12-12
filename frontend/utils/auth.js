import { defineStore } from "pinia";
import { ref } from "vue";

export const authState = defineStore("auth", () => {
  const isLogged = ref(false);
  const user = ref(null);

  function setUser(cookieUser) {
    user.value = cookieUser;
    isLogged.value = true;
  }

  function logout() {
    user.value = null;
    isLogged.value = false;
  }

  return { isLogged, user, setUser, logout };
});
