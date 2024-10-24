<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-card style="min-width: 70%" bordered>
      <q-form @submit="createNewErrata">
        <q-card-section>
          <div class="text-h6">Create New Advisory</div>
        </q-card-section>
        <q-card-section class="row q-gutter-md" style="max-width: 100%">
          <q-input
            label="ID"
            v-model="advisoryId"
            class="col"
            hint="Example: ALSA-2024:A001"
            :rules="[(val) => !!val || 'ID is required']"
          />
          <q-select
            v-model="platform"
            :options="platforms"
            label="Platform"
            class="col"
            clearable
            :rules="[(val) => !!val.value || 'Platform is required']"
          />
          <q-input
            v-model="issued_date"
            type="date"
            class="col"
            label="Issued Date"
            :rules="[(val) => !!val || 'Date is required']"
          />
          <q-input
            v-model="updated_date"
            type="date"
            class="col"
            label="Updated Date"
            :rules="[(val) => !!val || 'Date is required']"
          />
        </q-card-section>
        <q-card-section class="row q-gutter-md" style="max-width: 100%">
          <q-input
            label="Module"
            v-model="errataModule"
            class="col"
            hint="Can be empty"
          />
          <q-input
            label="Version"
            v-model="version"
            class="col"
            hint="'3' by default"
            :rules="[(val) => !!val || 'Version is required']"
          />
          <q-input
            label="Status"
            v-model="status"
            class="col"
            hint="'final' by default"
            :rules="[(val) => !!val || 'Status is required']"
          />
          <q-select
            ref="refSeverity"
            v-model="severity"
            class="col"
            :options="severities"
            label="Severity"
            :rules="[(val) => !!val || 'Severity is required']"
          />
        </q-card-section>
        <q-card-section class="q-gutter-md" style="max-width: 100%">
          <q-input
            v-model="title"
            label="Bulletin title"
            :rules="[(val) => !!val || 'Title is required']"
          />
          <q-input
            type="textarea"
            input-style="height: 75px"
            v-model="description"
            label="Description"
            :rules="[(val) => !!val || 'Description is required']"
          />
        </q-card-section>
        <q-card-section>
          <q-table
            flat
            title="References"
            :rows="references"
            :columns="refColumns"
            row-key="id"
            hide-pagination
            :rows-per-page-options="[0]"
            no-data-label="No References"
          >
            <template v-slot:top-right>
              <div class="q-gutter-md">
                <q-btn
                  no-caps
                  flat
                  round
                  icon="add"
                  class="add-btn"
                  color="primary"
                  @click="onAddReferance()"
                >
                  <q-tooltip> Add Reference </q-tooltip>
                </q-btn>
              </div>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="id" :props="props">
                  {{ props.row.ref_id }}
                </q-td>
                <q-td key="ref_type" :props="props">
                  {{ errataReferenceType[props.row.ref_type] }}
                  <q-btn
                    v-if="errataReferenceType[props.row.ref_type] === 'CVE'"
                    size="sm"
                    color="accent"
                    round
                    dense
                    @click="props.expand = !props.expand"
                    :icon="props.expand ? 'remove' : 'add'"
                  >
                    <q-tooltip> Show CVE info </q-tooltip>
                  </q-btn>
                </q-td>
                <q-td key="href" :props="props">
                  <a :href="props.row.href" target="_blank">
                    {{ props.row.href }}
                  </a>
                </q-td>
                <q-td class="text-right">
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      icon="edit"
                      @click="onEditReferance(props.row)"
                    />
                    <q-btn
                      class="del-btn"
                      flat
                      dense
                      round
                      icon="delete"
                      @click="deleteRef(props.row)"
                    />
                  </div>
                </q-td>
              </q-tr>
              <q-tr v-show="props.expand" :props="props" v-if="props.row.cve">
                <q-td colspan="100%" class="text-left">
                  <q-tr>
                    <q-th>ID</q-th>
                    <q-th>Public</q-th>
                    <q-th>CWE</q-th>
                    <q-th>Severity</q-th>
                    <q-th>Ref CVSS3</q-th>
                  </q-tr>
                  <q-tr>
                    <q-td>
                      {{ props.row.cve.id }}
                    </q-td>
                    <q-td>
                      {{ formatDate(props.row.cve.public) }}
                    </q-td>
                    <q-td>
                      {{ props.row.cve.cwe }}
                    </q-td>
                    <q-td>
                      {{ toCapitalize(props.row.cve.impact) }}
                    </q-td>
                    <q-td>
                      {{ props.row.cve.cvss3 }}
                    </q-td>
                  </q-tr>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-table
            flat
            title="Packages"
            :rows="packages"
            :columns="pkgColumns"
            hide-pagination
            :rows-per-page-options="[0]"
            no-data-label="No Packages"
          >
            <template v-slot:top-right>
              <div class="q-gutter-md">
                <q-input
                  v-model="textValue"
                  label="Enter Build ID or Build link"
                  style="width: 280px"
                  dense
                  @keydown.enter.prevent="parseBuildId(textValue)"
                >
                  <template v-slot:after>
                    <q-btn
                      round
                      dense
                      flat
                      color="primary"
                      icon="add"
                      @click="parseBuildId(textValue)"
                      :loading="loadingBuild"
                    >
                      <q-tooltip> Add packages from Build </q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>
            </template>

            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th v-for="col in props.cols" :key="col.name" :props="props">
                  <div v-if="col.name === 'epoch'" class="row">
                    <div v-if="packages.length !== 0" class="col q-gutter-none">
                      <span>
                        {{ col.label }}
                      </span>
                      <q-icon name="edit" />
                      <q-popup-edit
                        v-model="allEpoch"
                        title="Update epoch"
                        buttons
                        v-slot="scope"
                        @hide="setEpoch()"
                      >
                        <q-input
                          v-model="scope.value"
                          type="number"
                          dense
                          autofocus
                          @keyup.enter="scope.set"
                        />
                      </q-popup-edit>
                      <q-tooltip>
                        Click to set Epoch to all packages
                      </q-tooltip>
                    </div>
                    <div v-else class="col">
                      {{ col.label }}
                    </div>
                  </div>
                  <template v-else>
                    {{ col.label }}
                  </template>
                </q-th>
              </q-tr>
            </template>

            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="name" :props="props">
                  <q-btn
                    v-if="props.row.build_id"
                    class="add-btn"
                    flat
                    dense
                    round
                    icon="link"
                    @click="goToBuild(props.row.build_id)"
                  >
                    <q-tooltip>
                      Click to go to the Build {{ props.row.build_id }}
                    </q-tooltip>
                  </q-btn>
                  {{ props.row.name }}
                </q-td>
                <q-td key="epoch" :props="props">
                  <q-popup-edit
                    v-model="props.row.epoch"
                    title="Update epoch"
                    buttons
                    v-slot="scope"
                  >
                    <q-input
                      type="number"
                      v-model="scope.value"
                      dense
                      autofocus
                    />
                  </q-popup-edit>
                  {{ props.row.epoch }}
                  <q-tooltip> Click to edit Epoch </q-tooltip>
                </q-td>
                <q-td key="version" :props="props">
                  {{ props.row.version }}
                </q-td>
                <q-td key="release" :props="props">
                  {{ props.row.release }}
                </q-td>
                <q-td key="arch" :props="props">
                  {{ props.row.arch }}
                </q-td>
                <q-td key="reboot_suggested" :props="props">
                  <q-checkbox
                    v-model="props.row.reboot_suggested"
                    checked-icon="task_alt"
                    unchecked-icon="highlight_off"
                  />
                </q-td>
                <q-td class="text-right">
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn
                      class="del-btn"
                      flat
                      dense
                      round
                      icon="delete"
                      @click="deletePkg(props.row)"
                    />
                  </div>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            color="primary"
            style="width: 15%"
            type="submit"
            :loading="loading"
            label="Create"
            no-caps
          >
            <template v-slot:loading>
              <q-spinner-hourglass class="on-left" />
              Loading...
            </template>
          </q-btn>
        </q-card-actions>
      </q-form>
    </q-card>
    <ErrataReferencesSelection
      ref="errataReferencesSelection"
      @addRef="addReferance"
      @editRef="editReferance"
    />
  </div>
</template>

<script>
  import {defineComponent, ref} from 'vue'
  import {Notify} from 'quasar'
  import {ErrataReferenceType, BuildStatus} from '../constants.js'
  import {splitRpmFileName} from 'src/utils'
  import ErrataReferencesSelection from 'components/ErrataReferencesSelection.vue'

  export default defineComponent({
    name: 'CreateErrata',
    data() {
      return {
        advisoryId: '',
        platform: '',
        version: '3',
        status: 'final',
        severity: '',
        issued_date: '',
        updated_date: '',
        title: '',
        allEpoch: 0,
        description: '',
        severities: ['Low', 'Moderate', 'Important', 'Critical'],
        references: [],
        uniqueBuildsId: new Set(),
        errataModule: '',
        packages: [],
        refColumns: [
          {
            name: 'id',
            required: true,
            label: 'ID',
            align: 'left',
            field: (row) => row.ref_id,
            sortable: true,
          },
          {
            name: 'ref_type',
            align: 'left',
            label: 'Type',
            required: true,
          },
          {
            name: 'href',
            align: 'left',
            label: 'URL',
            required: true,
          },
        ],
        pkgColumns: [
          {
            name: 'name',
            required: true,
            label: 'Name',
            align: 'left',
            sortable: true,
          },
          {
            name: 'epoch',
            required: true,
            label: 'Epoch',
            align: 'center',
          },
          {
            name: 'version',
            required: true,
            label: 'Version',
            align: 'left',
          },
          {
            name: 'release',
            required: true,
            label: 'Release',
            align: 'left',
          },
          {
            name: 'arch',
            required: true,
            label: 'Arch',
            align: 'left',
            sortable: true,
          },
          {
            name: 'reboot_suggested',
            required: true,
            label: 'Reboot Suggested',
            align: 'center',
          },
        ],
        loading: false,
        loadingBuild: false,
        name_error: false,
        textValue: '',
        errataReferenceType: ErrataReferenceType,
      }
    },
    computed: {
      platforms() {
        return this.$store.state.platforms.platforms.map((platform) => {
          return {
            label: platform.name,
            value: platform.id,
          }
        })
      },
    },
    methods: {
      goToBuild(build_id) {
        window.open(`/build/${build_id}`, '_blank')
      },
      onAddReferance() {
        this.$refs.errataReferencesSelection.open()
      },
      onEditReferance(reference) {
        this.$refs.errataReferencesSelection.open(reference)
      },
      editReferance(oldRef, newRef) {
        this.deleteRef(oldRef)
        this.addReferance(newRef)
      },
      addReferance(newRef) {
        this.references.push(newRef)
      },
      nameRule(values) {
        return !!values && values.indexOf(' ') < 0
      },
      platformsRule(values) {
        let flag = true
        if (values === null) {
          values = []
        }
        if (values.length === 0) {
          flag = false
        }
        return flag
      },
      deletePkg(item) {
        let index = this.packages.indexOf(item)
        this.packages = [
          ...this.packages.slice(0, index),
          ...this.packages.slice(index + 1),
        ]
      },
      deleteRef(item) {
        let index = this.references.indexOf(item)
        this.references = [
          ...this.references.slice(0, index),
          ...this.references.slice(index + 1),
        ]
      },
      formatDate(date) {
        const longEnUSFormatter = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        return longEnUSFormatter.format(new Date(date))
      },
      toCapitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
      },
      parseBuildId(textValue) {
        if (
          textValue.match(`${window.origin}/build/`) &&
          textValue.match(/build\/(\d+)/)
        ) {
          this.loadBuildInfo(textValue.match(/build\/(\d+)/)[1])
        } else if (parseInt(textValue)) {
          this.loadBuildInfo(textValue)
        } else {
          Notify.create({
            message: 'Invalid Build ID or Build link',
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
        }
      },
      setEpoch() {
        this.packages.forEach((pkg) => {
          pkg.epoch = this.allEpoch
        })
        console.log(this.packages)
      },
      loadBuildInfo(buildId) {
        if (this.uniqueBuildsId.has(+buildId)) {
          Notify.create({
            message: `Build ${buildId} already added`,
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
          return
        }
        if (this.loadingBuild) return

        this.loadingBuild = true
        let pkgs = []
        this.$api
          .get(`/builds/${buildId}/`)
          .then((response) => {
            this.loadingBuild = false
            let build = response.data
            this.uniqueBuildsId.add(+buildId)
            let buildRunning = false

            build.tasks.forEach((task) => {
              switch (task.status) {
                case BuildStatus.COMPLETED:
                  for (let artifact of task.artifacts) {
                    if (
                      artifact.type !== 'rpm' ||
                      artifact.name.includes('.src.')
                    )
                      continue
                    let pkg = splitRpmFileName(artifact.name)
                    pkgs.push({
                      name: pkg.name,
                      epoch: 0,
                      version: pkg.version,
                      release: pkg.release,
                      arch: pkg.arch,
                      reboot_suggested: false,
                      build_id: build.id,
                    })
                  }
                  break
                case BuildStatus.FAILED:
                  break
                case BuildStatus.EXCLUDED:
                  break
                default:
                  buildRunning = true
              }
            })
            if (buildRunning) {
              Notify.create({
                message: `Build ${buildId} is still running`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
              this.uniqueBuildsId.delete(+buildId)
            } else if (pkgs.length === 0) {
              Notify.create({
                message: `Build ${buildId} failed`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
              this.uniqueBuildsId.delete(+buildId)
            } else {
              this.packages = this.packages.concat(pkgs)
            }
            this.textValue = ''
          })
          .catch((error) => {
            this.loadingBuild = false
            console.log(error)
            if (error.response.status === 404) {
              Notify.create({
                message: `Build ${buildId} does not exist`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: 'Invalid Build ID or Build link',
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
          })
      },
      createNewErrata() {
        if (this.references.length === 0) {
          Notify.create({
            message: 'You need to add at least one reference',
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
          return
        }
        if (this.packages.length === 0) {
          Notify.create({
            message: 'You need to add at least one package',
            type: 'negative',
            actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
          })
          return
        }
        this.loading = true
        let pkgs = []
        let pkgsSet = new Set()
        this.packages.forEach((pkg) => {
          let nevra = `${pkg.epoch}:${pkg.name}-${pkg.version}-${pkg.release}.${pkg.arch}`
          if (!pkgsSet.has(nevra)) {
            pkgsSet.add(nevra)
            pkgs.push({
              name: pkg.name,
              version: pkg.version,
              release: pkg.release,
              epoch: pkg.epoch,
              arch: pkg.arch,
              reboot_suggested: pkg.reboot_suggested,
            })
          }
        })
        let data = {
          id: this.advisoryId,
          freezed: false,
          status: this.status,
          version: this.version,
          platform_id: this.platform.value,
          issued_date: this.issued_date,
          updated_date: this.updated_date,
          title: this.title,
          description: this.description,
          module: this.module,
          severity: this.severity,
          references: this.references,
          packages: pkgs,
        }
        this.$api
          .post('/errata/new/', data)
          .then((response) => {
            this.loading = false
            Notify.create({
              message: `Advisory ${this.advisoryId} has been created`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.$router.push('/errata')
          })
          .catch((error) => {
            this.loading = false
            if (+String(error.response.status)[0] === 4) {
              let msg = error.response.data.detail[0].msg
              Notify.create({
                message: msg,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: 'negative',
                actions: [
                  {label: 'Dismiss', color: 'white', handler: () => {}},
                ],
              })
            }
          })
      },
    },
    components: {
      ErrataReferencesSelection,
    },
  })
</script>

<style scoped>
  .del-btn:hover {
    color: #ff4649;
  }
  .add-btn:hover {
    color: #0069da;
  }
</style>
