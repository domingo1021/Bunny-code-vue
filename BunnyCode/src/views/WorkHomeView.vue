<template>
  <div>前三名的 Project</div>
  <div>Create Project</div>
</template>
<!-- <template>Create Project</template> -->

<script setup>
import Socket from '../socket';

const props = defineProps({
  userID: Number,
  socket: Socket,
})

</script>