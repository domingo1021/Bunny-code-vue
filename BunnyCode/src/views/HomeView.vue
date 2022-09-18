<template>
  <div class="window">
    <div class="title-bar">
      <button aria-label="Close" class="close"></button>
      <h1 class="title">Bunny code</h1>
      <button aria-label="Resize" class="resize"></button>
    </div>
    <div class="separator"></div>

    <div class="window-pane">&nbsp; {{ helloContent }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
const helloContent = ref("");
const pendingContent = ref([
  {
    content: ".",
    action: "create",
    time: "100",
  },
  {
    content: " ",
    action: "replace",
    time: "500",
  },
  {
    content: ".",
    action: "replace",
    time: "500",
  },
  {
    content: " ",
    action: "replace",
    time: "500",
  },
  {
    content: ".",
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
    time: "150",
  },
  {
    content: "l",
    action: "create",
    time: "150",
  },
  {
    content: "c",
    action: "create",
    time: "150",
  },
  {
    content: "o",
    action: "create",
    time: "150",
  },
  {
    content: "m",
    action: "create",
    time: "140",
  },
  {
    content: "e",
    action: "create",
    time: "140",
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
    time: "140",
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
      console.log(pendingContent.value[index].content)
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
