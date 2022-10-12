import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import axios from "axios";
import Swal from "sweetalert2";

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
      path: "/workspace/:projectName/:versionNumber?",
      name: "workspace",
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
      path: "/user/:pageUserID",
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
      path: "/not-found",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
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
      await axios({
        method: "get",
        url: productionServer + "/api/1.0/user/auth",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      isLogin = true;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please log in",
      });
      isLogin = false;
    }
    if (!isLogin) {
      return next({
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
      const authResponse = await axios({
        method: "get",
        url: productionServer + "/api/1.0/user/auth",
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
      return next({
        name: "user",
        params: { pageUserID: userID },
      });
    } else {
      return next();
    }
  } else {
    return next();
  }
});

export default router;
