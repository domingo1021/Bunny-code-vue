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