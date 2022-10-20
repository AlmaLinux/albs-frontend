<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-stepper v-model="currentStep"
               ref="buildWizzard"
               class="col-7"
               style="min-height: 600px;">
      <q-step name="buildEnvironment"
              title="Build environment"
              style="height: auto;"
              :done="currentStep != 'buildEnvironment'"
              :error="checkError()" error-color="negative">

        <q-checkbox left-label class="text-grey-8 text-body1 q-pb-sm"
                    v-model="buildPlan.is_secure_boot" label="Secure Boot"/>

        <q-checkbox left-label class="text-grey-8 text-body1 q-pb-sm"
                    v-model="parallelMode" label="Parallel mode"/>

        <q-select v-model="product"
                  :options="buildProducts"
                  label="Product:"
                  clearable
                  style="min-width: 250px; max-width: 300px"
                  ref="selectProduct"
                  :rules="[val => !!val || 'Product is required']"
                  :hint="!product ? 'Product is required' : null"
        />

        <q-select v-model="buildPlan.platforms"
                  :options="buildPlatforms"
                  multiple
                  use-chips
                  label="Build platform(s):"
                  style="min-width: 250px; max-width: 300px"
                  ref="selectPlatforms"
                  :rules="[val => !(val.length < 1) || 'Platforms is required']"
                  :hint="buildPlan.platforms.length === 0 ? 'Platforms is required' : null"
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
                    :label="`${platform.label} selected architectures`"
                    style="min-width: 250px; max-width: 300px"
                    ref="selectArches"
                    :rules="[val => checkArchError(val) || 'Architectures is required']"
                    :hint="!checkArchError(platformArches[platform.label]) ? 'Architectures is required' : null"
          />
        </template>

        <q-select v-model="buildPlan.platform_flavors"
                  :options="buildPlatformFlavors"
                  multiple
                  use-chips
                  label="Build flavors:"
                  style="min-width: 250px; max-width: 300px"
        >
        </q-select>

        <q-input label="Linked builds" v-model="linked_builds_input" clearable @keydown.enter.prevent="addLinkedBuilds"
                style="min-width: 250px; max-width: 300px;" autogrow hint="Enter builds' ids"
                :rules="[linked_builds_input => linked_builds_input.length < 1 || 'Please don\'t forget to add entered builds\'s ids']">
          <template v-slot:append v-if="linked_builds_input">
            <q-btn round dense flat icon="add" @click="addLinkedBuilds"/>
          </template>
        </q-input>

        <q-list v-if="buildPlan.linked_builds.length" style="min-width: 250px; max-width: 300px;">
          <q-item v-for="linkedBuild in buildPlan.linked_builds" :key="linkedBuild">
            <q-item-section>
              <router-link :to="`/build/${linkedBuild}`" target="_blank">
                {{ linkedBuild }}
              </router-link>
            </q-item-section>
            <q-item-section side>
              <q-btn icon="delete" small round flat dense color="negative"
                    @click="buildPlan.linked_builds.pop(linkedBuild)"/>
            </q-item-section>
          </q-item>
        </q-list>

        <q-field borderless style="margin-left: -15px; padding-top: 10px;">
          <q-btn label="Mock Options" flat icon-right="settings" color="grey-7"
                @click="onAddMockOptions"></q-btn>
          <MockOptionsSelection ref="addMockOptions"
                                :buildMockOpts="buildPlan.mock_options"
                                @change="value => { buildPlan.mock_options = value }"/>
        </q-field>
        <q-expansion-item label="Added mock options" v-if="Object.keys(buildPlan.mock_options).length && buildPlan.mock_options.type != 'change'">
          <q-list v-if="Object.keys(buildPlan.mock_options).length" dense highlight no-border>
            <q-item-section v-if="buildPlan.mock_options.with" style="font-size: 12pt; letter-spacing: 1pt;">
              --with '{{ buildPlan.mock_options.with.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.without" style="font-size: 12pt; letter-spacing: 1pt;">
              --without '{{ buildPlan.mock_options.without.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.target_arch" style="font-size: 12pt; letter-spacing: 1pt;">
              --target '{{ buildPlan.mock_options.target_arch }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.yum_exclude" style="font-size: 12pt; letter-spacing: 1pt;">
              -x '{{ buildPlan.mock_options.yum_exclude.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.definitions" style="font-size: 12pt; letter-spacing: 1pt;">
              <q-item-section v-for="name in Object.keys(buildPlan.mock_options.definitions)" :key="name">
                --define '{{ name }} {{ buildPlan.mock_options.definitions[name] }}'
              </q-item-section>
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.module_enable" style="font-size: 12pt; letter-spacing: 1pt;">
              enable modules: {{ buildPlan.mock_options.module_enable.join(' ') }}
            </q-item-section>
          </q-list>
        </q-expansion-item>
      </q-step>

      <q-step name="selectProjects" :disable="checkError()"
              title="Select projects" :error="buildPlan.tasks.length < 1 && currentStep != 'buildEnvironment'"
              error-color="negative" icon="format_list_numbered">
        <project-selector :buildItems="buildPlan.tasks"
                          :platformName="buildPlan.platforms[0].value"
                          :platformArches="platformArches"
                          :flavors="buildPlan.platform_flavors"
                          :modularityVersions="modularityVersions()"
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
          <q-btn @click="onNextStep" :loading="loading"
                 icon-right="chevron_right" color="primary">
            {{ nextLabel }}
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import {Loading, Notify} from 'quasar'
import ProjectSelector from 'components/ProjectSelector.vue'
import MockOptionsSelection from 'components/MockOptionsSelection.vue'

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
        linked_builds: [],
        is_secure_boot: false,
        mock_options: {},
        platform_flavors: []
      },
      product: null,
      parallelMode: true,
      platformArches: platformArches,
      currentStep: 'buildEnvironment',
      linked_builds_input: '',
      loading: false,
      mock_options: false,
      modularity: false
    }
  },
  computed: {
    nextLabel () {
      const labelMap = {
        buildEnvironment: 'Select projects',
        selectProjects: 'Create build',
        selectModules: 'Create build'
      }
      if (this.modularity) labelMap.buildEnvironment = 'Select modules'
      return labelMap[this.currentStep]
    },
    buildPlatforms () {
      return this.$store.state.platforms.platforms.map(platform => {
        return {label: platform.name, value: platform.name, description: platform.arch_list.join(', '), archList: platform.arch_list, modularityVersions: platform.modularity.versions }
      })
    },
    buildPlatformFlavors () {
      return this.$store.state.platform_flavors.flavors.map(flavour => {
        return {label: flavour.name, value: flavour.name, id: flavour.id}
      })
    },
    buildProducts () {
      return this.$store.state.products.products.map(product => {
        return {label: product.name, value: product.id }
      })
    },
  },
  methods: {
    checkArchError (val) {
      return val ? val.length !== 0 : false
    },
    checkError () {
      if (this.buildPlan.platforms.length < 1 || !this.product) return true

      let err =  false
      this.buildPlan.platforms.forEach(platform => {
        err = !this.checkArchError(this.platformArches[platform.label])
      })
      return err
    },
    onAddMockOptions () {
      this.$refs.addMockOptions.open(this.buildPlan.mock_options)
    },
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

      if (this.checkError()) {
        this.$refs.selectProduct.validate()
        this.$refs.selectPlatforms.validate()
        if (this.$refs.selectArches && this.$refs.selectArches.length) {
          this.$refs.selectArches.forEach(arches => {
            arches.validate()
          })
        }

        Notify.create({message: 'Please fill out all required fields', type: 'negative',
            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
      }
      this.$refs.buildWizzard.next()
    },
    onPreviousStep () {
      this.$refs.buildWizzard.previous()
    },
    modularityVersions (){
      if (this.buildPlan.platforms[0].modularityVersions) {
        return this.buildPlan.platforms[0].modularityVersions.map (version => {
          return version.name
        })
      }
    },
    createBuild () {
      this.loading = true
      let platforms = []
      let cachePlatforms = this.buildPlan.platforms
      for (let platform of this.buildPlan.platforms) {
        platforms.push({
          name: platform.value,
          arch_list: this.platformArches[platform.value],
          parallel_mode_enabled: this.parallelMode
        })
      }
      this.buildPlan.platforms = platforms
      let flavors = []
      for (let flavour of this.buildPlan.platform_flavors) {
        flavors.push(flavour.id)
      }
      this.buildPlan.platform_flavors = flavors
      this.buildPlan.product_id = this.product.value
      let cacheTasks = JSON.parse(JSON.stringify(this.buildPlan.tasks))
      this.$api.post('/builds/', this.buildPlan)
        .then((response) => {
          Notify.create({message: `Build ${response.data.id} created`, type: 'positive',
            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
          this.loading = false
          this.$router.push('/')
        })
        .catch((error) => {
          this.buildPlan.platforms = cachePlatforms
          this.buildPlan.tasks = cacheTasks
          Notify.create({message: 'Unable to create a build', type: 'negative',
            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
          this.loading = false
        })
    }
  },
  components: {
    ProjectSelector,
    MockOptionsSelection
  }
})
</script>

<style scoped>
</style>
