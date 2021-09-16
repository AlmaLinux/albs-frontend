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

        <template v-for="platform in buildPlan.platforms" :key="platform.label">
        <q-select v-model="platformArches[platform.label]"
                  :options="platform.archList"
                  multiple
                  chips
                  :label="`Build platform ${platform.label} selected architectures`"
                  style="min-width: 250px; max-width: 300px"
         />
        </template>

        <q-input label="Linked builds" v-model="linked_builds_input" clearable
                 style="min-width: 250px; max-width: 300px;" autogrow hint="Enter builds' ids"
                 :rules="[linked_builds_input => linked_builds_input.length < 1 || 'Please don\'t forget to add entered builds\'s ids']">
          <template v-slot:append v-if="linked_builds_input">
            <q-btn round dense flat icon="add" @click="addLinkedBuilds"/>
          </template>
        </q-input>

        <q-list v-if="buildPlan.linked_builds.length" style="min-width: 250px; max-width: 300px;">
          <q-item v-for="linkedBuild in buildPlan.linked_builds" :key="linkedBuild">
            <q-item-section>
              <router-link :to="`/build/${linkedBuild}`">
                {{ linkedBuild }}
              </router-link>
            </q-item-section>
            <q-item-section side>
              <q-btn icon="delete" small round flat dense color="negative"
                     @click="buildPlan.linked_builds.pop(linkedBuild)"/>
            </q-item-section>
          </q-item>
        </q-list>

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
import {Loading, Notify} from 'quasar'
import ProjectSelector from 'components/ProjectSelector.vue'

export default defineComponent({
  name: 'BuildPlanner',
  data () {
    let platformArches = {}
    for (const platform of this.$store.state.platforms.platforms) {
      platformArches[platform.name] = platform.arch_list
    }
    return {
      buildPlan: {
        platforms: [],
        tasks: [],
        linked_builds: []
      },
      platformArches: platformArches,
      currentStep: 'buildEnvironment',
      linked_builds_input: ''
    }
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
      return this.$store.state.platforms.platforms.map(platform => {
        return {label: platform.name, value: platform.name, description: platform.arch_list.join(', '), archList: platform.arch_list}
      })
    }
  },
  methods: {
    addLinkedBuilds () {
      let inputs = this.linked_builds_input.split(' ')
        inputs.forEach(e => this.checkLinkedBuilds(e))
    },
    checkLinkedBuilds (linkedId) {
      if (parseInt(linkedId)) {
        Loading.show()
        this.$api.get(`/builds/${parseInt(linkedId)}/`)
          .then(response => {
            Loading.hide()
            let found_build = response.data
            for (let i in found_build.tasks) {
              // TODO: Ugly way to add only finished builds
              if (found_build.tasks[i].status === 2 || found_build.tasks[i].status === 3) {
                this.buildPlan.linked_builds.push(found_build.id)
              }
            }
            this.buildPlan.linked_builds = this.buildPlan.linked_builds.filter((v, i, a) => a.indexOf(v) === i)
          })
          .catch(() => {
            Loading.hide()
            Notify.create({
              type: 'negative',
              message: `Build ${linkedId} not found`,
              actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
            })
          })
      }
      else {
        Notify.create({
          type: 'negative',
          message: 'Not build\'s id entered',
          actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
        })
      }
      this.linked_builds_input = ''
    },
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
      let platforms = []
      for (let platform of this.buildPlan.platforms) {
        platforms.push({name: platform.value, arch_list: this.platformArches[platform.value]})
      }
      this.buildPlan.platforms = platforms
      Loading.show()
      this.$api.post('/builds/', this.buildPlan)
        .then(() => {
          Loading.hide()
          this.$router.push('/')
        })
        .catch(() => {
          Loading.hide()
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
