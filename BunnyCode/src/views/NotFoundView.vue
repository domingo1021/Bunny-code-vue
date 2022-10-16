<template>
  <div id="hello-window">
    <div id="hello-content">{{ helloContent }}</div>
  </div>
  <div id="workspace-introduce">
    <img
      src="@/assets/404.png"
      width="500"
      height="500"
      alt="work-space-introduction"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Socket from '../socket'

const props = defineProps({
  userID: Number,
  socket: Socket,
  terminateSocket: Function,
})

const emits = defineEmits(['setUserID'])
const helloContent = ref('')
const router = useRouter()
const pendingContent = ref([
  {
    content: '4',
    action: 'create',
    time: '20',
  },
  {
    content: '0',
    action: 'create',
    time: '100',
  },
  {
    content: '4',
    action: 'create',
    time: '100',
  },
  {
    content: '  ',
    action: 'create',
    time: '500',
  },
  {
    content: 'P',
    action: 'create',
    time: '80',
  },
  {
    content: 'a',
    action: 'create',
    time: '80',
  },
  {
    content: 'g',
    action: 'create',
    time: '80',
  },
  {
    content: 'e',
    action: 'create',
    time: '80',
  },
  {
    content: '  ',
    action: 'create',
    time: '200',
  },
  {
    content: 'N',
    action: 'create',
    time: '80',
  },
  {
    content: 'o',
    action: 'create',
    time: '80',
  },
  {
    content: 't',
    action: 'create',
    time: '80',
  },
  {
    content: '  ',
    action: 'create',
    time: '150',
  },
  {
    content: 'F',
    action: 'create',
    time: '80',
  },
  {
    content: 'o',
    action: 'create',
    time: '80',
  },
  {
    content: 'u',
    action: 'create',
    time: '80',
  },
  {
    content: 'n',
    action: 'create',
    time: '80',
  },
  {
    content: 'd',
    action: 'create',
    time: '80',
  },
  {
    content: '.',
    action: 'create',
    time: '50',
  },
])

function checkAction(index) {
  if (pendingContent.value[index].action === 'create') {
    helloContent.value += pendingContent.value[index].content
  } else if (pendingContent.value[index].action === 'replace') {
    helloContent.value =
      helloContent.value.substring(0, helloContent.value.length - 1) +
      pendingContent.value[index].content
  }
  index += 1
  if (index < pendingContent.value.length) {
    setTimeout(() => {
      checkAction(index)
    }, pendingContent.value[index].time)
  }
}

onMounted(() => {
  let index = 0
  setTimeout(() => {
    checkAction(index)
  }, pendingContent.value[index].time)
})
</script>

<style scoped>
#hello-window {
  font-size: 4rem;
  height: 120px;
  text-align: center;
  margin-top: 100px;
  color: azure;
  background: none;
}

#hello-logo {
  transition: 0.5s ease-in-out;
  transform: translateY(-180px);
}

#hello-content {
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

#workspace-introduce {
  display: flex;
  justify-content: center;
  margin: 0px 2% 0% 5%;
}

#workspace-introduce-word {
  width: 500px;
  align-self: center;
  margin-left: 100px;
  font-size: 2.5rem;
}
</style>
