<template>
  <div id="hello-window">
    <div id="hello-content">{{helloContent}}</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
const emits = defineEmits(["setUserID"]);
const helloContent = ref("");
const pendingContent = ref([
  {
    content: "|",
    action: "create",
    time: "20",
  },
  {
    content: " ",
    action: "replace",
    time: "500",
  },
  {
    content: "|",
    action: "replace",
    time: "500",
  },
  {
    content: " ",
    action: "replace",
    time: "500",
  },
  {
    content: "|",
    action: "replace",
    time: "500",
  },
  {
    content: " ",
    action: "replace",
    time: "500",
  },
  {
    content: "W",
    action: "create",
    time: "400",
  },
  {
    content: "e",
    action: "create",
    time: "80",
  },
  {
    content: "l",
    action: "create",
    time: "80",
  },
  {
    content: "c",
    action: "create",
    time: "80",
  },
  {
    content: "o",
    action: "create",
    time: "80",
  },
  {
    content: "m",
    action: "create",
    time: "80",
  },
  {
    content: "e",
    action: "create",
    time: "80",
  },
  {
    content: " ",
    action: "create",
    time: "140",
  },
  {
    content: "t",
    action: "create",
    time: "140",
  },
  {
    content: "o",
    action: "create",
    time: "80",
  },
  {
    content: " ",
    action: "create",
    time: "500",
  },
  {
    content: "b",
    action: "create",
    time: "100",
  },
  {
    content: "u",
    action: "create",
    time: "100",
  },
  {
    content: "n",
    action: "create",
    time: "100",
  },
  {
    content: "n",
    action: "create",
    time: "100",
  },
  {
    content: "y",
    action: "create",
    time: "100",
  },
  {
    content: " ",
    action: "create",
    time: "100",
  },
  {
    content: "c",
    action: "create",
    time: "50",
  },
  {
    content: "o",
    action: "create",
    time: "50",
  },
  {
    content: "d",
    action: "create",
    time: "50",
  },
  {
    content: "e",
    action: "create",
    time: "50",
  },
  {
    content: " ",
    action: "create",
    time: "50",
  },
  {
    content: "!",
    action: "create",
    time: "50",
  },
  {
    content: "!",
    action: "create",
    time: "50",
  },
  {
    content: "!",
    action: "create",
    time: "50",
  },
]);

function checkAction(index) {
  if (pendingContent.value[index].action === "create") {
    helloContent.value += pendingContent.value[index].content;
  } else if (pendingContent.value[index].action === "replace") {
    helloContent.value =
      helloContent.value.substring(0, helloContent.value.length - 1) +
      pendingContent.value[index].content;
  }
  index += 1;
  if (index < pendingContent.value.length) {
    setTimeout(() => {
      checkAction(index);
    }, pendingContent.value[index].time);
  }
}

onMounted(() => {
  let index = 0;
  setTimeout(() => {
    checkAction(index);
  }, pendingContent.value[index].time);
});
</script>

<style scoped>
#hello-window{
  font-size: 4rem;
  height: 120px;
  text-align: center;
  margin-top: 150px;
  color: azure;
  background: none;
}

#hello-logo{
  transition: 0.5s ease-in-out;
  transform: translateY(-180px);
}

#hello-content{
  top: 35px;
  text-shadow: 2px 2px #847e7e;
  font-weight: bold;
}

.title {
  color: black;
}
.window-pane {
  text-align: center;
  color: black;
  font-size: 2rem;
  height: 100px;
}
</style>
