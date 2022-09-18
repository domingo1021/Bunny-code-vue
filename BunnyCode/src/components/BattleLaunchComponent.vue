<template>
  <div id="save-alert">
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="false"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header text-center">
            <h4 class="modal-title w-100 font-weight-bold">Create Version</h4>
            <button
              type="button"
              class="close btn btn-indigo"
              data-bs-dismiss="modal"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body mx-3">是否要儲存？</div>
          <div style="display: flex; justify-content: center;">
            <button class="confirm-btn" @click="saveFileRecord">是</button>
            <button class="confirm-btn" @click="hideModal">否</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modalObject: Object,
})
</script>