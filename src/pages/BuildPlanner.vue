<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-stepper v-model="currentStep"
               ref="buildWizzard"
               class="col-7"
               style="min-height: 600px;">
      <q-step name="buildEnvironment"
              title="Build environment"
              style="height: 25vw;">

        <q-select v-model="buildPlan.platforms"
                  :options="buildPlatforms"
                  multiple
                  chips
                  label="Build platform(s):"
                  style="min-width: 250px; max-width: 300px"
         >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label v-html="scope.opt.label" />
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!--<linked-build-selector v-model="buildPlan.linkedBuilds"-->
        <!--                       label="Linked builds:" :labelWidth="4"/>-->

      </q-step>

      <q-step name="selectProjects"
              title="Select projects">
        <ProjectSelector :buildItems="buildPlan.tasks"
                         @change="value => { buildPlan.tasks = value }"/>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation class="group row justify-end">
          <q-btn @click="onPreviousStep"
                 flat
                 color="primary"
                 v-if="currentStep !== 'buildEnvironment'">
            Back
          </q-btn>
          <q-btn @click="onNextStep"
                 icon-right="chevron_right" color="primary">
            {{ nextLabel }}
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ProjectSelector from 'components/ProjectSelector.vue'

export default defineComponent({
  name: 'BuildPlanner',
  data () {
    return {
      buildPlan: {
        platforms: [],
        tasks: []
      },
      currentStep: 'buildEnvironment'
    }
  },
  created () {
  },
  computed: {
    nextLabel () {
      const labelMap = {
        buildEnvironment: 'Select projects',
        selectProjects: 'Create build'
      }
      return labelMap[this.currentStep]
    },
    buildPlatforms () {
      // TODO: add arch
      return this.$store.state.platforms.platforms.map(platform => {
        return {label: platform.name, value: platform.name, description: platform.arch_list.join(', ')}
      })
    }
  },
  methods: {
    onNextStep () {
      if (this.nextLabel === 'Create build') {
        this.createBuild()
        return
      }
      this.$refs.buildWizzard.next()
    },
    onPreviousStep () {
      this.$refs.buildWizzard.previous()
    },
    createBuild () {
      this.$api.post('/builds/', this.buildPlan)
        .then(() => {
          console.log('done')
          this.$router.push('/')
        })
        .catch(() => {
          console.log('fail')
          this.$router.push('/')
        })
    }
  },
  components: {
    ProjectSelector
  }
})
</script>

<style scoped>
</style>
