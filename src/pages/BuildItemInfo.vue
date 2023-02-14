<template>
  <div class="text-left bg-grey-2 shadow-2" style="padding-left: 5em;">
    <p class="text-dark" style="font-size: 25px">
      {{`${project_name} ${arch}`}}
    </p>
    <q-tabs side v-model="tab" class="text-primary">
      <q-tab name="build-tab" label="Build Logs" />
      <q-tab name="test-tab" label="Test Logs" />
    </q-tabs>
  </div>
  <q-tab-panels
    v-model="tab"
    animated
    transition-prev="slide-right"
    transition-next="slide-left"
  >
    <q-tab-panel name="build-tab">
      <build-logs :buildId="buildId" :taskId="taskId"/>
    </q-tab-panel>

    <q-tab-panel name="test-tab">
      <test-logs :buildId="buildId" :taskId="taskId"/>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
  import { defineComponent } from 'vue'
  import BuildLogs from './BuildLogs.vue'
  import TestLogs from './TestLogs.vue'

  export default defineComponent({
      data() {
          return {
              tab: 'build-tab',
              project_name: this.$route.query.project_name,
              arch: this.$route.query.arch
          }
      },
      props: {
          buildId: String,
          taskId: String,
      },
      components: {
          BuildLogs,
          TestLogs
      }
  })
</script>
