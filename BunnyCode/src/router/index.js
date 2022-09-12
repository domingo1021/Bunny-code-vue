import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
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
      props: true,
    }
  ],
});

export default router;
