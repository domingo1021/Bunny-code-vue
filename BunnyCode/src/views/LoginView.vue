<template>Redirect: {{redirect}}</template>
<script setup>
import { ref, onBeforeMount } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();
const redirect = ref("");

onBeforeMount(() => {
  console.log(route.fullPath);
  redirect.value = route.query.redirect;
  console.log("Router query: ", route.query);
})

</script>
