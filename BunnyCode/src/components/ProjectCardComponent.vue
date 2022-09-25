<template>
  <div class="card" style="width: 18rem">
    <div class="card-body">
      <h5 class="project-card-title card-title">
        <div style="display: flex; width: 100%; justify-content: center">
          <div id="project-card-user-name" @click="goUserProfile">
            {{ projectObject.userName }}&nbsp; / &nbsp;
          </div>
          <div id="project-card-project-name" @click="goWorkspace">
            {{ projectObject.projectName }}
          </div>
        </div>
      </h5>
      <h6 class="card-subtitle mb-2 text-muted">
        Star: {{ projectObject.starCount }} Watch:
        {{ projectObject.watchCount }}
      </h6>
      <p class="card-text">{{ projectObject.projectDescription }}&nbsp;</p>
      <!-- <a href="#" class="card-link">Card link</a> -->
      <!-- <a href="#" class="card-link">Another link</a> -->
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  projectObject: Object,
});

const router = useRouter();

function goUserProfile() {
  router.push({
    name: "user",
    params: { pageUserID: props.projectObject.userID },
  });
}

function goWorkspace() {
  router.push(`/workspace/${props.projectObject.projectName}`);
}

</script>

<style scoped>
.card {
  background-color: #21262d;
  border: 0.3px solid #85888b;
  height: 100%;
}
/* .card:hover {
  cursor: pointer;
  background-color: rgb(69, 75, 103);
} */
.project-card-title {
  display: block;
  text-align: center;
}

#project-card-user-name:hover {
  cursor: pointer;
}

#project-card-project-name:hover {
  cursor: pointer;
}
</style>
