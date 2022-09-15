<template>
  <div
    class="modal fade"
    id="exampleModal"
    ref="modalObject"
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
      </div>
      <div class="modal-footer d-flex justify-content-center">
        <!-- <button
            id="valid-btn"
            class="btn btn-indigo"
            data-bs-dismiss="modal"
            @click="createVersion"
            v-if="buttonClickable"
          >
            Submit <i class="fas fa-paper-plane-o ml-1"></i>
          </button>
          <button id="invalid-btn" class="btn btn-indigo" v-else>Submit</button> -->
      </div>
    </div>
  </div>
</template>

<script setup></script>
