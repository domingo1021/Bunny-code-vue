<template>
  <body>
    <div class="main">
      <input type="checkbox" id="chk" aria-hidden="true" />

      <div class="signup">
        <form>
          <label for="chk" aria-hidden="true">Sign up</label>
          <input
            v-model="signUpName"
            type="text"
            name="txt"
            placeholder="User name"
            required=""
          />
          <input
            v-model="signUpEmail"
            type="email"
            name="email"
            placeholder="Email"
            required=""
          />
          <input
            v-model="signUpPassword"
            type="password"
            name="pswd"
            placeholder="Password"
            required=""
          />
          <div class="warning">{{ signUpMessage }}</div>
          <button type="button" @click="signUp" :disabled="isDisabled">
            Sign up
          </button>
        </form>
      </div>

      <div class="login">
        <form>
          <label for="chk" aria-hidden="true">Login</label>
          <input
            v-model="loginEmail"
            type="email"
            name="email"
            placeholder="Email"
            required=""
          />
          <input
            v-model="loginPassword"
            type="password"
            name="pswd"
            placeholder="Password"
            required=""
          />
          <div class="warning">{{ loginMessage }}</div>
          <button type="button" @click="login">Login</button>
        </form>
      </div>
    </div>
  </body>
</template>
<script setup>
import axios from "axios";
import { ref, onBeforeMount } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();
const redirect = ref("");
const loginEmail = ref("");
const loginPassword = ref("");
const loginMessage = ref("");
const signUpName = ref("");
const signUpEmail = ref("");
const signUpPassword = ref("");
const signUpMessage = ref("");
const isDisabled = ref(false);
const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";
const emits = defineEmits(["setUserID"]);

function checkEmail(category, email) {
  const regex = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (!regex.test(email)) {
    switch (category) {
      case "signup":
        signUpMessage.value = "Invalid email format";
        setTimeout(() => {
          signUpMessage.value = "";
        }, 5000);
        break;
      case "login":
        loginMessage.value = "Invalid email format";
        setTimeout(() => {
          loginMessage.value = "";
        }, 5000);
        break;
    }
    return false;
  }
  return true;
}

function checkPassword(category, password) {
  const regex = new RegExp(/^(?=.*[a-z])(?=.*\d).{6,30}$/);
  if (!regex.test(password)) {
    switch (category) {
      case "signup":
        signUpMessage.value =
          "Password must contain one number, one small character, and 6~30 characters";
        setTimeout(() => {
          signUpMessage.value = "";
        }, 10000);
        break;
      case "login":
        loginMessage.value =
          "Password must contain one number, one small character, and 6~30 characters";
        setTimeout(() => {
          loginMessage.value = "";
        }, 10000);
        break;
    }
    return false;
  }
  return true;
}

function checkName(name) {
  if (name.length === 0) {
    signUpMessage.value = "User name required.";
    setTimeout(() => {
      signUpMessage.value = "";
    }, 5000);
    return false;
  }
  return true;
}

async function signUp() {
  isDisabled.value = true;
  if (!checkName(signUpName.value)) {
    isDisabled.value = false;
    return;
  } else if (!checkEmail("signup", signUpEmail.value)) {
    isDisabled.value = false;
    return;
  } else if (!checkPassword("signup", signUpPassword.value)) {
    isDisabled.value = false;
    return;
  }
  let signUpResponse;
  try {
    signUpResponse = await axios.post(
      productionServer + "/api/1.0/user/signup",
      {
        name: signUpName.value,
        email: signUpEmail.value,
        password: signUpPassword.value,
      }
    );
  } catch (error) {
    signUpMessage.value = error.response.data.msg;
    setTimeout(() => {
      signUpMessage.value = "";
    }, 5000);
    isDisabled.value = false;
    return;
  }
  isDisabled.value === false;
  const userID = signUpResponse.data.data.user.id;
  emits("setUserID", userID);
  localStorage.setItem("jwt", signUpResponse.data.data.access_token);
  router.push({ name: "user", params: { userID: userID } });
}

async function login() {
  isDisabled.value = true;
  if (!checkEmail("login", loginEmail.value)) {
    isDisabled.value = false;
    return;
  } else if (!checkPassword("login", loginPassword.value)) {
    isDisabled.value = false;
    return;
  }
  let loginResopnse;
  try {
    loginResopnse = await axios.post(productionServer + "/api/1.0/user/signin", {
      email: loginEmail.value,
      password: loginPassword.value,
    });
  } catch (error) {
    loginMessage.value = error.response.data.msg;
    setTimeout(() => {
      loginMessage.value = "";
    }, 5000);
    isDisabled.value = false;
    return;
  }
  isDisabled.value = false;
  const userID = loginResopnse.data.data.user.id;
  emits("setUserID", userID);
  localStorage.setItem("jwt", loginResopnse.data.data.access_token);
  router.push({ name: "user", params: { userID: userID } });
}

onBeforeMount(() => {
  console.log(route.fullPath);
  redirect.value = route.query.redirect;
  console.log("Router query: ", route.query);
});
</script>

<style scoped>
body {
  background-image: url("@/assets/login.jpg");
  background-size: cover;
  background-attachment: fixed;
  background-position-x: center;
  background-position-y: center;
}
body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  height: 100vh;
  background-image: url("@/assets/login.jpg");
  background-size: cover;
  background-attachment: fixed;
  background-position-x: center;
  background-position-y: center;
  font-family: "Jost", sans-serif;
  /* background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e); */
}

.main {
  width: 350px;
  height: 500px;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 5px 20px 50px #000;
  top: -50px;
}
#chk {
  display: none;
}
.signup {
  background: linear-gradient(to bottom, #423d6c, #302b63, #24243e);
  border-radius: 10px;
  position: relative;
  width: 100%;
  height: 100%;
}
label {
  color: #fff;
  font-size: 2.3em;
  justify-content: center;
  display: flex;
  margin: 60px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.5s ease-in-out;
}
input {
  width: 60%;
  height: 20px;
  background: #e0dede;
  justify-content: center;
  display: flex;
  margin: 20px auto;
  padding: 10px;
  border: none;
  outline: none;
  border-radius: 5px;
}
button {
  width: 60%;
  height: 40px;
  margin: 10px auto;
  justify-content: center;
  display: block;
  color: #fff;
  background: #573b8a;
  font-size: 1em;
  font-weight: bold;
  margin-top: 20px;
  outline: none;
  border: none;
  border-radius: 5px;
  transition: 0.2s ease-in;
  cursor: pointer;
}
button:hover {
  background: #6d44b8;
}
.login {
  height: 460px;
  background: #eee;
  border-radius: 60% / 10%;
  transform: translateY(-180px);
  transition: 0.8s ease-in-out;
}
.login label {
  color: #573b8a;
  transform: scale(0.6);
}

.warning {
  color: rgb(222, 56, 56);
  text-align: center;
}

#chk:checked ~ .login {
  transform: translateY(-500px);
}
#chk:checked ~ .login label {
  transform: scale(1);
}
#chk:checked ~ .signup label {
  transform: scale(0.6);
}
</style>
