<template>
  <div class="card" style="width: 18rem">
    <div class="card-body">
      <h5 class="card-title">{{projectObject.userName}} {{projectObject.projectName}}</h5>
      <h6 class="card-subtitle mb-2 text-muted">Star: {{projectObject.starCount}} Watch: {{projectObject.watchCount}}</h6>
      <p class="card-text">
        {{projectObject.projectDescription}}&nbsp;
      </p>
      <!-- <a href="#" class="card-link">Card link</a> -->
      <!-- <a href="#" class="card-link">Another link</a> -->
    </div>
  </div>
</template>

<script setup>
defineProps({
  projectObject: Object,
})
</script>

<style scoped>
.card{
  background-color: #21262d;
  border: 0.3px solid #85888b;
  height: 100%
}
.card:hover{
  cursor: pointer;
  background-color: rgb(69, 75, 103);
}
</style>