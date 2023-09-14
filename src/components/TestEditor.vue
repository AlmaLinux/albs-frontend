<template>
  <q-dialog position="top" v-model="opened">
    <q-card style="min-width: 50%">
      <q-card-section>
        <div class="text-h6">
          <build-ref :buildRef="pack" />
        </div>
      </q-card-section>
      <div>
        <q-tabs v-model="tab" class="text-primary">
          <q-tab name="env" label="ENV" />
          <q-tab name="tests" label="Tests" />
        </q-tabs>

        <q-tab-panels v-model="tab">
          <q-tab-panel name="env">
            <q-markup-table
              v-if="pack.test_env && pack.test_env.length !== 0"
              class="q-pt-lg"
              flat
            >
              <thead>
                <tr>
                  <th class="text-center">Name</th>
                  <th class="text-center">Value</th>
                  <th class="text-center" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(value, key) of pack.test_env" :key="key">
                  <td class="text-center">
                    {{ key }}
                  </td>

                  <td class="text-center">
                    {{ value }}
                  </td>

                  <td class="text-center">
                    <q-btn
                      flat
                      round
                      icon="delete"
                      class="del-btn"
                      @click="onDeleteEnv(key)"
                    />
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
            <div class="q-pt-lg group row justify-end">
              <q-btn
                @click="addEnv = true"
                icon="add"
                color="secondary"
                id="pse-qb-add-project"
              >
                Add env
              </q-btn>
            </div>
          </q-tab-panel>

          <q-tab-panel name="tests">
            <q-markup-table
              v-if="pack.tests && pack.tests.length !== 0"
              class="q-pt-lg"
              flat
            >
              <thead>
                <tr>
                  <th class="text-center" />
                  <th class="text-center" />
                  <th class="text-left">Package name</th>
                  <th class="text-center">Test repository</th>
                  <th class="text-right" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(repo, index) in pack.tests" :key="repo">
                  <td class="no-padding text-center">
                    <q-btn
                      @click="onMoveTestItemUp(repo)"
                      v-if="index !== 0"
                      flat
                      class="no-padding"
                    >
                      <q-icon name="arrow_drop_up" />
                    </q-btn>
                  </td>
                  <td class="no-padding text-center">
                    <q-btn
                      @click="onMoveTestItemDown(repo)"
                      v-if="index !== pack.tests.length - 1"
                      flat
                      class="no-padding"
                    >
                      <q-icon name="arrow_drop_down" />
                    </q-btn>
                  </td>
                  <td>
                    <a :href="repo.url" target="_blank">
                      {{ repo.package_name }}
                    </a>
                  </td>

                  <td class="text-center">{{ repo.repo }}</td>

                  <td>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      class="del-btn"
                      @click="onDeleteTest(repo)"
                    />
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
            <div class="q-pt-lg group row justify-end">
              <q-btn
                @click="addTest = true"
                icon="add"
                color="secondary"
                id="pse-qb-add-project"
              >
                Add test
              </q-btn>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
      <q-card-actions align="right">
        <q-btn label="ok" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog position="top" v-model="addTest">
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Add test</div>
      </q-card-section>
      <q-card-section>
        <q-select
          v-model="testRepo"
          :options="testRepositories"
          label="Test repository"
          @update:model-value="onTestRepoSelected"
        />
        <q-select
          v-model="test"
          :options="packagesOpt"
          label="Package name"
          use-input
          @filter="packagesFilter"
          input-debounce="0"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Add" color="primary" @click="onAddTest" />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog position="top" v-model="addEnv">
    <q-card style="width: 50%">
      <q-form @submit="onAddENV" class="q-gutter-md">
        <q-card-section>
          <div class="text-h6">Add ENV</div>
        </q-card-section>
        <q-card-section>
          <div class="row justify-center">
            <div class="row no-wrap group">
              <q-input
                v-model="envName"
                lazy-rules
                label="Name"
                clearable
                style="width: 50%"
                :rules="[(val) => !!val || 'Name is required']"
                ref="envNameInput"
              >
              </q-input>
              <q-input
                v-model="envValue"
                lazy-rules
                label="Value"
                clearable
                style="margin-left: 20px; width: 50%"
                :rules="[(val) => !!val || 'Value is required']"
                ref="envValueInput"
              ></q-input>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Add" color="primary" type="submit" />
          <q-btn flat text-color="negative" label="Cancel" v-close-popup />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent, ref} from 'vue'
  import BuildRef from 'components/BuildRef.vue'
  import {Notify} from 'quasar'

  export default defineComponent({
    props: {
      platformName: String,
    },
    data() {
      return {
        opened: false,
        pack: {},
        tab: 'env',
        envName: '',
        envValue: '',
        testRepo: null,
        test: null,
        allTests: null,
        packagesOpt: [],
        addTest: false,
        addEnv: false,
      }
    },
    computed: {
      testRepositories() {
        return this.$store.state.testRepositories.testRepositories.map(
          (repo) => {
            return {
              label: repo.name,
              value: repo.id,
              tests: repo.packages,
            }
          }
        )
      },
    },
    methods: {
      open(pack) {
        this.pack = pack
        this.opened = true
      },
      close() {
        this.opened = false
      },
      onAddENV() {
        if (!this.pack.test_env) this.pack.test_env = {}

        this.pack.test_env[this.envName] = this.envValue
        this.envName = ''
        this.envValue = ''
        this.$refs.envValueInput.resetValidation()
        this.$refs.envNameInput.resetValidation()
        this.addEnv = false
      },
      onAddRef() {
        this.$refs.addRefWindow.open()
      },
      onTestRepoSelected(value) {
        this.allTests = value.tests.map((test) => {
          return {
            label: test.package_name,
            value: test.url,
            repo: value.label,
          }
        })
        this.test = null
      },
      packagesFilter(value, update) {
        this.packagesOpt = ref(this.allTests)

        update(() => {
          const needle = value.toLowerCase()
          this.packagesOpt = this.allTests.filter((v) =>
            v.label.toLowerCase().includes(needle)
          )
        })
      },
      onAddTest() {
        if (!this.testRepo || !this.test) return

        if (!this.pack.tests) this.pack.tests = []

        let alreadyAdded = false
        this.pack.tests.forEach((test) => {
          if (test.url === this.test.value) {
            alreadyAdded = true
          }
        })
        if (alreadyAdded) {
          const errorMsg = 'Test with this url is already added'
          Notify.create({message: errorMsg, icon: 'error', type: 'negative'})
          return
        }

        let newTest = {
          package_name: this.test.label,
          url: this.test.value,
          repo: this.test.repo,
        }
        this.pack.tests.push(newTest)
        this.addTest = false
        this.allTests = []
        this.testRepo = null
        this.test = null
      },
      onMoveTestItemUp(TestItem) {
        this.moveTestItem(TestItem, -1)
      },
      onMoveTestItemDown(TestItem) {
        this.moveTestItem(TestItem, 1)
      },
      moveTestItem(TestItem, direction) {
        const idx = this.pack.tests.indexOf(TestItem)
        this.pack.tests.splice(
          idx + direction,
          0,
          this.pack.tests.splice(idx, 1)[0]
        )
      },
      onDeleteTest(item) {
        let index = this.pack.tests.indexOf(item)
        this.pack.tests = [
          ...this.pack.tests.slice(0, index),
          ...this.pack.tests.slice(index + 1),
        ]
      },
      onDeleteEnv(key) {
        delete this.pack.test_env[key]
      },
    },
    components: {
      BuildRef,
    },
  })
</script>

<style scoped>
  .del-btn:hover {
    color: #ff4649;
  }
</style>
