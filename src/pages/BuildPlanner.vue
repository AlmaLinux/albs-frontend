<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-stepper
      v-model="currentStep"
      ref="buildWizzard"
      class="col-7"
      style="min-height: 600px"
    >
      <q-step
        name="buildEnvironment"
        title="Build environment"
        style="height: auto"
        :done="currentStep != 'buildEnvironment'"
        :error="checkError()"
        error-color="negative"
      >
        <q-checkbox
          left-label
          class="text-grey-8 text-body1 q-pb-sm"
          v-model="buildPlan.is_secure_boot"
          label="Secure Boot"
          id="build-planner-q-checkbox-secure-boot"
        />

        <q-checkbox
          left-label
          class="text-grey-8 text-body1 q-pb-sm"
          v-model="parallelMode"
          label="Parallel mode"
          id="build-planner-q-checkbox-parallel-mode"
        />

        <q-select
          v-model="product"
          :options="productsOptions"
          label="Product:"
          clearable
          style="min-width: 250px; max-width: 300px"
          ref="selectProduct"
          input-debounce="300"
          @filter="productFilter"
          use-input
          :rules="[(val) => !!val || 'Product is required']"
          :hint="!product ? 'Product is required' : null"
          id="build-planner-q-select-select-product"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label v-html="scope.opt.label" />
                <q-item-label v-if="scope.opt.description" caption>
                  {{ scope.opt.description }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-select
          v-model="buildPlan.platforms"
          :options="buildPlatforms"
          multiple
          use-chips
          label="Build platform(s):"
          style="min-width: 250px; max-width: 300px"
          ref="selectPlatforms"
          :rules="[(val) => !(val.length < 1) || 'Platforms is required']"
          :hint="
            buildPlan.platforms.length === 0 ? 'Platforms is required' : null
          "
          id="build-planner-q-select-select-platforms"
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
          <q-select
            v-model="platformArches[platform.label]"
            :options="platform.archList"
            multiple
            chips
            :label="`${platform.label} selected architectures`"
            style="min-width: 250px; max-width: 300px"
            ref="selectArches"
            :rules="[
              (val) => checkArchError(val) || 'Architectures is required',
            ]"
            :hint="
              !checkArchError(platformArches[platform.label])
                ? 'Architectures is required'
                : null
            "
            :id="`build-planner-q-select-arch-${platform.label.toLowerCase()}`"
          />
        </template>

        <q-select
          v-model="buildPlan.platform_flavors"
          :options="buildPlatformFlavors"
          multiple
          use-chips
          label="Build flavors:"
          style="min-width: 250px; max-width: 300px"
          id="build-planner-q-select-build-flavors"
        >
        </q-select>

        <q-input
          label="Linked builds"
          v-model="linked_builds_input"
          clearable
          @keydown.enter.prevent="addLinkedBuilds"
          style="min-width: 250px; max-width: 300px"
          autogrow
          hint="Enter builds' ids"
          :rules="[
            (linked_builds_input) =>
              linked_builds_input.length < 1 ||
              'Please don\'t forget to add entered builds\'s ids',
          ]"
          id="build-planner-q-input-linked-builds"
        >
          <template v-slot:append v-if="linked_builds_input">
            <q-btn round dense flat icon="add" @click="addLinkedBuilds" id="build-planner-q-btn-add-project" />
          </template>
        </q-input>

        <q-list
          v-if="buildPlan.linked_builds.length"
          style="min-width: 250px; max-width: 300px"
        >
          <q-item
            v-for="linkedBuild in buildPlan.linked_builds"
            :key="linkedBuild"
          >
            <q-item-section>
              <router-link :to="`/build/${linkedBuild}`" target="_blank">
                {{ linkedBuild }}
              </router-link>
            </q-item-section>
            <q-item-section side>
              <q-btn
                icon="delete"
                small
                round
                flat
                dense
                color="negative"
                @click="buildPlan.linked_builds.pop(linkedBuild)"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <q-field borderless style="margin-left: -15px; padding-top: 10px">
          <q-btn
            label="Global Mock Options"
            flat
            icon-right="settings"
            color="grey-7"
            @click="onAddMockOptions"
            id="build-planner-q-btn-add-mock-options"
          ></q-btn>
          <MockOptionsSelection
            ref="addMockOptions"
            :buildMockOpts="buildPlan.mock_options"
            @change="
              (value) => {
                buildPlan.mock_options = value
              }
            "
          />
        </q-field>
        <q-expansion-item
          label="Added mock options"
          v-if="
            Object.keys(buildPlan.mock_options).length &&
            buildPlan.mock_options.type != 'change'
          "
        >
          <q-list
            v-if="Object.keys(buildPlan.mock_options).length"
            dense
            highlight
            no-border
            class="mock-options"
          >
            <q-item-section v-if="buildPlan.mock_options.with">
              --with '{{ buildPlan.mock_options.with.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.without">
              --without '{{ buildPlan.mock_options.without.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.target_arch">
              --target '{{ buildPlan.mock_options.target_arch }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.yum_exclude">
              -x '{{ buildPlan.mock_options.yum_exclude.join(' ') }}'
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.definitions">
              <q-item-section
                v-for="name in Object.keys(buildPlan.mock_options.definitions)"
                :key="name"
              >
                --define '{{ name }}
                {{ buildPlan.mock_options.definitions[name] }}'
              </q-item-section>
            </q-item-section>
            <q-item-section v-if="buildPlan.mock_options.module_enable">
              enable modules:
              {{ buildPlan.mock_options.module_enable.join(' ') }}
            </q-item-section>
          </q-list>
        </q-expansion-item>
      </q-step>

      <q-step
        name="selectProjects"
        :disable="checkError()"
        title="Select projects"
        :error="buildPlan.tasks.length < 1 && currentStep != 'buildEnvironment'"
        error-color="negative"
        icon="format_list_numbered"
        id="build-planner-q-step-select-projects"
      >
        <project-selector
          :buildItems="buildPlan.tasks"
          :platformName="buildPlan.platforms[0].value"
          :platformArches="platformArches"
          :flavors="buildPlan.platform_flavors"
          :modularityVersions="modularityVersions()"
          @change="
            (value) => {
              buildPlan.tasks = value
            }
          "
        />
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation class="group row justify-end">
          <q-btn
            @click="onPreviousStep"
            flat
            color="primary"
            v-if="currentStep !== 'buildEnvironment'"
            id="build-planner-q-btn-back"
          >
            Back
          </q-btn>
          <q-btn
            @click="onNextStep"
            :loading="loading"
            icon-right="chevron_right"
            color="primary"
            id="build-planner-q-btn-create-build"
          >
            {{ nextLabel }}
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script>
  import {defineComponent, ref} from 'vue'
  import {Loading, Notify} from 'quasar'
  import ProjectSelector from 'components/ProjectSelector.vue'
  import MockOptionsSelection from 'components/MockOptionsSelection.vue'

  export default defineComponent({
    name: 'BuildPlanner',
    data() {
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
          platform_flavors: [],
        },
        product: null,
        parallelMode: true,
        platformArches: platformArches,
        currentStep: 'buildEnvironment',
        linked_builds_input: '',
        loading: false,
        mock_options: false,
        modularity: false,
        productsOptions: ref([]),
      }
    },
    computed: {
      nextLabel() {
        const labelMap = {
          buildEnvironment: 'Select projects',
          selectProjects: 'Create build',
          selectModules: 'Create build',
        }
        if (this.modularity) labelMap.buildEnvironment = 'Select modules'
        return labelMap[this.currentStep]
      },
      buildPlatforms() {
        return this.$store.state.platforms.platforms.map((platform) => {
          return {
            label: platform.name,
            value: platform.name,
            description: platform.arch_list.join(', '),
            archList: platform.arch_list,
            modularityVersions: platform.modularity
              ? platform.modularity.versions
              : '',
          }
        })
      },
      buildPlatformFlavors() {
        return this.$store.state.platform_flavors.flavors.map((flavour) => {
          return {label: flavour.name, value: flavour.name, id: flavour.id}
        })
      },
      buildProducts() {
        return this.$store.state.products.products
          .map((product) => {
            return {
              label: product.name,
              value: product.id,
              description: product.title,
            }
          })
          .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
      },
    },
    methods: {
      productFilter(val, update, abort) {
        update(() => {
          const needle = val.toLocaleLowerCase()
          this.productsOptions = this.buildProducts.filter(
            (v) => v.label.toLocaleLowerCase().indexOf(needle) > -1
          )
        })
        abort(() => {
          val = ''
        })
      },
      checkArchError(val) {
        return val ? val.length !== 0 : false
      },
      checkError() {
        if (this.buildPlan.platforms.length < 1 || !this.product) return true

        let err = false
        this.buildPlan.platforms.forEach((platform) => {
          err = !this.checkArchError(this.platformArches[platform.label])
        })
        return err
      },
      onAddMockOptions() {
        this.$refs.addMockOptions.open(this.buildPlan.mock_options)
      },
      addLinkedBuilds() {
        let inputs = this.linked_builds_input.split(' ')
        inputs.forEach((e) => this.checkLinkedBuilds(e))
      },
      checkLinkedBuilds(linkedId) {
        if (parseInt(linkedId)) {
          Loading.show()
          this.$api
            .get(`/builds/${parseInt(linkedId)}/`)
            .then((response) => {
              Loading.hide()
              let found_build = response.data
              for (let i in found_build.tasks) {
                // TODO: Ugly way to add only finished builds
                if (
                  found_build.tasks[i].status === 2 ||
                  found_build.tasks[i].status === 3
                ) {
                  this.buildPlan.linked_builds.push(found_build.id)
                }
              }
              this.buildPlan.linked_builds =
                this.buildPlan.linked_builds.filter(
                  (v, i, a) => a.indexOf(v) === i
                )
            })
            .catch(() => {
              Loading.hide()
              Notify.create({
                type: 'negative',
                message: `Build ${linkedId} not found`,
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            })
        } else {
          Notify.create({
            type: 'negative',
            message: "Not build's id entered",
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        }
        this.linked_builds_input = ''
      },
      onNextStep() {
        if (this.nextLabel === 'Create build') {
          this.createBuild()
          return
        }

        if (this.checkError()) {
          this.$refs.selectProduct.validate()
          this.$refs.selectPlatforms.validate()
          if (this.$refs.selectArches && this.$refs.selectArches.length) {
            this.$refs.selectArches.forEach((arches) => {
              arches.validate()
            })
          }

          Notify.create({
            message: 'Please fill out all required fields',
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        }
        this.$refs.buildWizzard.next()
      },
      onPreviousStep() {
        this.$refs.buildWizzard.previous()
      },
      modularityVersions() {
        if (this.buildPlan.platforms[0].modularityVersions) {
          return this.buildPlan.platforms[0].modularityVersions.map(
            (version) => {
              return version.name
            }
          )
        }
      },
      createBuild() {
        this.loading = true
        let platforms = []
        let cachePlatforms = this.buildPlan.platforms
        for (let platform of this.buildPlan.platforms) {
          platforms.push({
            name: platform.value,
            arch_list: this.platformArches[platform.value],
            parallel_mode_enabled: this.parallelMode,
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
        this.buildPlan.tasks.forEach((task) => {
          if (task.modules_yaml) {
            let module_mock_options = []
            task.enabled_modules = {
              buildtime: [],
              runtime: [],
            }
            task.enabled_modules_table.forEach((m) => {
              if (m.buildtime && m.add_to_buildtime)
                task.enabled_modules.buildtime.push(`${m.name}:${m.stream}`)
              if (m.runtime && m.add_to_runtime)
                task.enabled_modules.runtime.push(`${m.name}:${m.stream}`)
              if (m.enable) {
                m.no_stream
                  ? module_mock_options.push(`${m.name}`)
                  : module_mock_options.push(`${m.name}:${m.stream}`)
              }
            })
            if (module_mock_options.length !== 0) {
              task.refs.forEach((ref) => {
                if (!ref.mock_options) {
                  ref.mock_options = {module_enable: module_mock_options}
                } else if (!ref.mock_options.module_enable) {
                  ref.mock_options.module_enable = module_mock_options
                } else {
                  ref.mock_options.module_enable.concat(module_mock_options)
                }
              })
            }
          }
        })

        this.$api
          .post('/builds/', this.buildPlan)
          .then((response) => {
            Notify.create({
              message: `Build ${response.data.id} created`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.loading = false
            this.$router.push('/')
          })
          .catch((error) => {
            console.log(error)
            this.buildPlan.platforms = cachePlatforms
            this.buildPlan.tasks = cacheTasks
            if (+String(error.response.status)[0] === 4) {
              Notify.create({
                message: error.response.data.detail[0].msg,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}
                          Unable to create a build`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
            this.loading = false
          })
      },
    },
    components: {
      ProjectSelector,
      MockOptionsSelection,
    },
  })
</script>

<style scoped>
  .mock-options {
    font-family: monospace;
    font-size: 10pt;
    letter-spacing: 1pt;
    padding: 0.5em 0 1em 1em;
    width: 30vw;
  }
</style>
