<template>
  <div id="version-component">
    <div style="display: flex; justify-content: right">
      <button
        type="button"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
        style="border-radius: 5px; margin: 5% 5% 5%"
      >
        <div style="font-size: 1.25rem; width: 20px;">+</div>
        <!-- <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          class="bi bi-file-plus"
          viewBox="0 0 16 16"
        >
          <path
            d="M8.5 6a.5.5 0 0 0-1 0v1.5H6a.5.5 0 0 0 0 1h1.5V10a.5.5 0 0 0 1 0V8.5H10a.5.5 0 0 0 0-1H8.5V6z"
          />
          <path
            d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"
          />
        </svg> -->
      </button>
    </div>
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="true"
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
          <div class="modal-body mx-3">
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form2"
                >Version name</label
              >
              <input
                type="email"
                id="form2"
                class="form-control validate"
                v-model="versionName"
              />
            </div>
            <div class="warning" v-if="versionName.length > 29">
              Version name length too long.
            </div>
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form2"
                >File name</label
              >
              <input
                type="email"
                id="form2"
                class="form-control validate"
                v-model="fileName"
              />
            </div>
            <div class="warning" v-if="fileName.length > 29">
              File name length too long.
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-center">
            <button
              id="valid-btn"
              class="btn btn-indigo"
              data-bs-dismiss="modal"
              @click="createVersion"
              v-if="buttonClickable"
            >
              Submit <i class="fas fa-paper-plane-o ml-1"></i>
            </button>
            <button id="invalid-btn" class="btn btn-indigo" v-else>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUpdated } from "vue";
import axios from "axios";

const props = defineProps({
  projectID: Number,
  currentVersionLength: Number,
});

const emit = defineEmits([
  "updateFunction",
  "updateVersionIndex",
  "pushVersionObject",
]);

const versionName = ref("");
const fileName = ref("");
const buttonClickable = ref(false);

async function createVersion() {
  if (!fileName.value.includes(".js")) {
    fileName.value += ".js";
  }
  // TODO: post axios createProjectVersion
  // API endpoint: /project/:projectID/version
  let createVersionResponse;
  try {
    createVersionResponse = await axios({
      method: "post",
      url: `https://domingoos.store/api/1.0/project/${props.projectID}/version`,
      // url: `http://localhost:3000/api/1.0/project/${props.projectID}/version`,
      headers: {
        Authorization: `Bearer ${props.jwt}`,
      },
      data: {
        versionName: versionName.value,
        fileName: fileName.value,
      },
    });
  } catch (error) {
    console.log(error.response.data.msg);
    return;
  }
  console.log("response: ", createVersionResponse.data.data);
  const newVersionObject = createVersionResponse.data.data;
  if (newVersionObject.files.length !== 0) {
    newVersionObject.files.forEach((file, index) => {
      file.fileNumber = index;
      let tmpArray = file.fileName.split(".");
      if (tmpArray.length > 0) {
        file.language = tmpArray.pop().toUpperCase();
      } else {
        file.language = "";
      }
      file.fileContent = "";
      file.index = 0;
      file.line = 0;
      file.codeRecords = [];
      file.timeBetween = [];
    });
  }
  console.log("Create version response: ", createVersionResponse.data.data);
  emit("pushVersionObject", newVersionObject);
}
// Version Object:

// [{versionID: 28, versionName: 'version', versionNumber: 1, editing: 1, files: Array(1), records: [{…}]}, ...more object
// 後端回傳： versionID, VersionName, version Number, editing: 0, files:[{剛剛插入的 file 物件}], records.
// versionClick: update editing status of the two files.
// TODO: 思考 Playback 要根據前一個版本給 Playback  --> record 存取前一個版本的 fileURL.
onUpdated(() => {
  if (versionName.value.length > 29 || fileName.value.length > 29) {
    buttonClickable.value = false;
  } else {
    buttonClickable.value = true;
  }
});
</script>

<style scoped>
#version-component {
  color: #2c2c2c;
}
#project-content {
  text-align: center;
  margin-left: 10%;
  margin-right: 10%;
}
#flex-box {
  display: flex;
  margin: auto;
  /* justify-content: center; */
  /* align-self: center; */
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 1200px;
}

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
}

.flex-item {
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}
.label-header {
  width: 200px;
  top: 5px;
}

.warning {
  top: -20px;
  color: rgb(255, 100, 100);
}

.battle-title {
  width: 150px;
}

/* The search field */
#myInput {
  box-sizing: border-box;
  background-image: url("searchicon.png");
  background-position: 14px 12px;
  background-repeat: no-repeat;
  font-size: 16px;
  padding: 14px 20px 12px 45px;
  border: none;
  border-bottom: 1px solid #ddd;
}

#myInput:focus {
  outline: 1px solid #ddd;
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  display: flex;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: block;
  position: absolute;
  background-color: #f6f6f6;
  min-width: 230px;
  border: 1px solid #ddd;
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {
  background-color: #f1f1f1;
}
</style>
