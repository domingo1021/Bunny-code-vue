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
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/workspace",
      name: "workspace",
      component: () => import("../views/WorkSpace.vue"),
    },
    {
      path: "/playback",
      name: "playback",
      component: () => import("../views/PlayBackView.vue"),
    },
    {
      path: "/code-mirror",
      name: "code-mirror",
      component: () => import("../views/CodeMirrorView.vue"),
    },
    {
      path: "/code-mirror-playback",
      name: "code-mirror-playback",
      component: () => import("../views/PlaybackMirror.vue"),
    }
  ],
});

export default router;
