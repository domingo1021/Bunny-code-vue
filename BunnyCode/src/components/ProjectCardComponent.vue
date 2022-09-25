<template>
  <div class="card" style="width: 21rem; height: 9.5rem;">
    <div class="card-body">
      <h5 class="project-card-title card-title">
        <div style="display: flex; width: 100%; justify-content: center">
          <div id="project-card-user-name" @click="goUserProfile">
            {{ projectObject.userName }}
          </div>
          <div>&nbsp; / &nbsp;</div>
          <div id="project-card-project-name" @click="goWorkspace">
            {{ projectObject.projectName }}
          </div>
        </div>
      </h5>
      <h6 id="sub-data" class="card-subtitle mb-2 text-muted">
        Star: {{ projectObject.starCount }} Watch:
        {{ projectObject.watchCount }}
      </h6>
      <p id="project-description" class="card-text">{{ projectObject.projectDescription }}&nbsp;</p>
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
  margin-top: 2%;
  display: block;
  text-align: center;
}

#project-card-user-name{
  font-size: 1.25rem;
  font-weight: bold;
  padding-bottom: 3px;
  border-bottom: 1px solid;
}

#project-card-project-name{
  font-size: 1.25rem;
  font-weight: bold;
  padding-bottom: 3px;
  border-bottom: 1px solid;
}

#project-card-user-name:hover {
  cursor: pointer;
}

#project-card-project-name:hover {
  cursor: pointer;
}

#sub-data{
  margin-top: 5%;
}

#project-description{
  margin-top: 4%;
}
</style>
