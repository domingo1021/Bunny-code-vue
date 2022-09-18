import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import axios from "axios";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/workspace",
      name: "workspace_home",
      component: () => import("../views/WorkHomeView.vue"),
    },
    {
      path: "/battle",
      name: "battle_home",
      component: () => import("../views/BattleHomeView.vue"),
    },
    {
      path: "/code-mirror/:projectName",
      name: "code-mirror",
      component: () => import("../views/WorkSpace.vue"),
      props: true,
    },
    {
      path: "/code-mirror/:projectName/version/:versionName",
      name: "code-mirror-version",
      component: () => import("../views/WorkSpace.vue"),
      props: true,
    },
    {
      path: "/battle/:battleID",
      name: "battle",
      component: () => import("../views/BattleView.vue"),
      meta: { requireAuth: true },
      props: true,
    },
    {
      path: "/battle/review/:battleID",
      name: "battle_review",
      component: () => import("../views/BattleReview.vue"),
      meta: { requireAuth: true },
      props: true,
    },
    {
      path: "/user/:userID",
      name: "user",
      component: () => import("../views/UserView.vue"),
      props: true,
      meta: { requireAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/*",
      redirect: "/login",
    },
  ],
});

const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";

router.beforeEach(async (to, from, next) => {
  console.log("fullpath: ", to.fullPath);
  if (to.matched.some((record) => record.meta.requireAuth)) {
    let isLogin = false;
    try {
      let jwt = localStorage.getItem("jwt");
      console.log(localhostServer + "/api/1.0/user/auth");
      await axios({
        method: "get",
        url: productionServer + "/api/1.0/user/auth",
        // url: localhostServer + "/api/1.0/user/auth",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      isLogin = true;
    } catch (error) {
      alert("Please log in !");
      isLogin = false;
    }
    if (!isLogin) {
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    }
  }

  if (to.fullPath === "/login") {
    let isLogin = false;
    let userID;
    try {
      let jwt = localStorage.getItem("jwt");
      console.log(localhostServer + "/api/1.0/user/auth");
      const authResponse = await axios({
        method: "get",
        url: productionServer + "/api/1.0/user/auth",
        // url: localhostServer + "/api/1.0/user/auth",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      userID = authResponse.data.data;
      isLogin = true;
    } catch (error) {
      isLogin = false;
    }
    if (isLogin) {
      next({
        name: "user",
        params: { userID: userID },
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
