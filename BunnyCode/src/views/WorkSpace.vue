<template>
  <div style="display: flex; height: 100vh;">
    <div id="left-bar">
      <div id="folder-control" @click="updateTarget('Folder')">Folder</div>
      <div id="version-control" @click="updateTarget('Version')">Version</div>
    </div>
    <div id="info-bar">
      <div
        v-if="
          Object.keys(projectDetail).length !== 0 && targetFunction === 'Folder'
        "
      >
        <div
          v-for="(info, index) in projectDetail?.version[targetVersionIndex]
            ?.files"
          :key="index"
          style="display: flex;"
          @click="changeCurrFile(info.fileName, index)"
        >
          <div style="color: yellow; margin-right: 10px;">
            {{ info.language }}
          </div>
          <div>{{ info.fileName }}</div>
        </div>
      </div>
      <div
        v-else-if="
          Object.keys(projectDetail).length !== 0 &&
          targetFunction === 'Version'
        "
      >
        <CreateVersionComponent
          v-if="authorization === true"
          :projectID="projectDetail.projectID"
          :currentVersionLength="projectDetail.version.length"
          @updateTargetVersion="updateTargetVersion"
          @updateTarget="updateTarget"
          @pushVersionObject="pushVersionObject"
        />
        <div
          class="version-list"
          v-for="(version, index) in projectDetail?.version"
          @click="updateTargetVersion(index)"
          :key="index"
        >
          第 {{ version.versionNumber }} 版 &nbsp; {{ version.versionName }}
        </div>
      </div>
    </div>
    <div id="main-content" v-if="targetFunction === 'Folder'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <div v-if="projectDetail.version.length !== 0">
          <CodeMirrorView
            v-if="Object.keys(projectDetail).length !== 0"
            :socket="props.socket"
            :readOnly="readOnly"
            :authorization="authorization"
            :projectID="projectDetail.projectID"
            :targetVersionIndex="targetVersionIndex"
            :version="projectDetail?.version[targetVersionIndex]"
            :recordInfo="projectDetail?.version[targetVersionIndex]?.records"
            :folderInfo="projectDetail?.version[targetVersionIndex]?.files"
            @changeUserStatus="changeUserStatus"
            @pushSaveRecordsRoot="pushSaveRecordsRoot"
          />
          <div v-else></div>
        </div>
        <div v-else></div>
      </div>
      <div v-else></div>
    </div>
    <div id="main-content-2" v-else-if="targetFunction === 'Version'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <FolderController
          :targetVersionIndex="targetVersionIndex"
          :version="projectDetail.version[targetVersionIndex]"
          @updateTarget="updateTarget"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Socket from '../socket'
import { useRouter } from 'vue-router'
import { onBeforeMount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import CodeMirrorView from './CodeMirrorView.vue'
import FolderController from './FolderController.vue'
import CreateVersionComponent from '../components/CreateVersionComponent.vue'

const localhostServer = 'http://localhost:3000'
const productionServer = "https://domingoos.store";
const projectDetail = ref({})
const targetFunction = ref('Folder')
// default target version 為第一個 version, (之後根據使用者點選version 做修改)
const targetVersionIndex = ref(0)
const authorization = ref(false)
const readOnly = ref(true)

//TODO: debug: change route when user click header instead
const router = useRouter()
// const route = useRoute();

const props = defineProps({
  userID: Number,
  socket: Socket,
  projectName: String,
});

function updateTarget(target) {
  // 跳到 File or 跳到 version.
  targetFunction.value = target
}

function updateTargetVersion(versionIndex) {
  console.log("updateTargetVersion:", versionIndex);
  targetVersionIndex.value = versionIndex
}

function pushVersionObject(versionObject) {
  projectDetail.value.version.push(versionObject)
  targetFunction.value = 'Folder'
  targetVersionIndex.value = projectDetail.value.version.length - 1
  console.log(projectDetail.value.version[targetVersionIndex.value].files)
}

function changeUserStatus(emitObject) {
  readOnly.value = emitObject.readOnly
  authorization.value = emitObject.authorization
}

function pushSaveRecordsRoot(emitObject) {
  projectDetail.value.version[emitObject.targetVersionIndex].records.push(
    emitObject.newSaveRecords,
  )
  readOnly.value = true
}

async function updateProjectDetail() {
  // console.log("projectName: ", props.projectName);
  let projectResponse
  try {
    projectResponse = await axios.get(
      productionServer +
      // localhostServer +
        `/api/1.0/project/detail?projectName=${props.projectName}`,
    )
  } catch (error) {
    console.log(error)
    alert(error.response.data.msg)
    return
  }
  projectDetail.value = projectResponse.data.data
  projectDetail.value.version.forEach((version) => {
    if (version.files.length !== 0) {
      version.files.forEach((file, index) => {
        file.fileNumber = index
        let tmpArray = file.fileName.split('.')
        if (tmpArray.length > 0) {
          file.language = tmpArray.pop().toUpperCase()
        } else {
          file.language = ''
        }
        file.fileContent = ''
        file.index = 0
        file.line = 0
        file.codeRecords = []
        file.timeBetween = []
      })
    }
  })
  console.log('Project content: ', projectDetail.value)
}

watch(
  () => props.projectName,
  async (newProjectName, prevProjectName) => {
    await updateProjectDetail()
  },
)

onBeforeMount(async () => {
  await updateProjectDetail()

})

onMounted(() => {
  setTimeout(async () => {
    if (props.userID !== projectDetail.value.userID) {
      console.log("add project view count");
      await axios.put(
        `${productionServer}/api/1.0/project/watch?projectID=${projectDetail.value.projectID}`
        // `http://localhost:3000/api/1.0/project/watch?projectID=${projectDetail.value.projectID}`,
      )
    }
  }, 5000)
})
</script>

<style scoped>
.version-list {
  font-size: 0.75rem;
}
#folder-control{
  margin-top: 10px;
  margin-bottom: 4%;
  /* border: 0.5px solid rgb(255,255,255);
  border-radius: 5px; */
  padding: 5%;
}
/* #folder:hover{
  background-color: #5e4242;
  padding: 5%;
} */
#left-bar {
  background-color: #2a2a2a;
}
#info-bar {
  border-left: 1px solid rgb(255, 255, 255);
  padding-left: 30px;
  padding-right: 20px;
  width: 250px;
  background-color: rgb(25, 25, 25);
  color: rgb(255, 255, 255);
}
#main-content {
  background-color: #161515;
  width: 100%;
}
#main-content-2 {
  width: 100%;
}
</style>
