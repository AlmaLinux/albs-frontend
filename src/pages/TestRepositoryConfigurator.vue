<template>
  <div v-if="testRepo" class="q-pl-xl q-pr-lg row" max-width>
    <div class="q-pa-md" style="width: 40%">
      <q-card>
        <q-card-section>
          <div class="text-h6">Configure Test Repository</div>
        </q-card-section>
        <q-form>
          <q-card-section>
            <q-input v-model="testRepo.name" autogrow label="Name" readonly />
            <q-input v-model="testRepo.url" autogrow label="URL" readonly />
            <q-input
              v-model="testRepo.tests_dir"
              label="Tests directory"
              hint="Enter a new tests directory for the test repository"
            />
            <q-input
              v-model="testRepo.tests_prefix"
              label="Tests prefix"
              hint="Enter a new tests prefix for the test repository"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              text-color="negative"
              label="Delete"
              v-close-popup
              @click="confirmDeleteRepo = true"
              id="tfe-qb-new-test_repository-cancel"
            />
            <q-btn
              flat
              text-color="primary"
              label="Update"
              style="width: 20%"
              @click="confirmUpdateRepo = true"
              id="tfe-qb-new-test_repository-add"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </div>

    <div class="q-pa-md items-start" style="width: 60%">
      <q-table
        title="Packages"
        :filter="packageFilter"
        :rows="testRepo.packages"
        :columns="columns"
        color="primary"
        no-data-label="There are no packages in this test repository"
        v-model:pagination="pagination"
        hide-pagination
        wrap-cells
        :loading="tableLoading"
        ref="packTable"
      >
        <template v-slot:top-right>
          <div class="row q-gutter-sm">
            <q-input
              dense
              rounded
              standout="bg-grey-4"
              v-model="packageFilter"
              input-class="text-black"
              class="q-ml-md"
              ref="searchField"
              text-color="black"
              debounce="300"
            >
              <template v-slot:after>
                <div class="q-gutter-sm">
                  <q-icon
                    v-if="packageFilter !== ''"
                    name="close"
                    color="grey"
                    @click="packageFilter = ''"
                    class="cursor-pointer"
                  >
                    <q-tooltip> Click to clear </q-tooltip>
                  </q-icon>
                  <q-btn
                    round
                    unelevated
                    icon="search"
                    color="primary"
                    :loading="tableLoading"
                    @click="focusSearch()"
                  />
                </div>
              </template>
            </q-input>
            <div>
              <q-btn
                round
                @click="addNewPackage = true"
                icon="library_add"
                color="green"
                id="tfe-qb-add-new-test_repository"
              >
                <q-tooltip> Add a new package manually </q-tooltip>
              </q-btn>
            </div>
          </div>
        </template>
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
            <q-th auto-width />
          </q-tr>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="package_name" :props="props">{{
              props.row.package_name
            }}</q-td>
            <q-td key="folder_name" :props="props">
              <a
                :href="folderURL(testRepo, props.row.folder_name)"
                target="_blank"
              >
                {{ props.row.folder_name }}
              </a>
            </q-td>
            <q-td auto-width>
              <q-btn
                flat
                round
                icon="delete"
                class="del-btn"
                @click="selectDeletingPackage(props.row)"
              >
                <q-tooltip> Delete package </q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
      <div class="row justify-center q-mt-md">
        <q-pagination
          v-model="pagination.page"
          color="primary"
          :max="totalPageNumber()"
          input
          size="sm"
        />
      </div>
    </div>
  </div>

  <q-dialog v-model="addNewPackage">
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">
          Add New Package Manually
          <q-badge transparent align="top" color="orange">
            <q-icon name="warning" color="white" />
            <q-tooltip>
              Be careful adding packages manually. Make sure a folder with that
              name exists in the test repository
            </q-tooltip>
          </q-badge>
        </div>
      </q-card-section>
      <q-form @submit="newPackage">
        <q-card-section>
          <q-input
            v-model="newPackageName"
            label="Name*"
            hint="Enter a name for a package"
            :rules="[(val) => !!val || 'Name is required']"
          />
          <q-input
            v-model="newPackageFolderName"
            label="Test Folder URL*"
            hint="Enter test folder for a package"
            :rules="[(val) => !!val || 'Test Folder is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="negative"
            label="Cancel"
            v-close-popup
            @click="addNewPackage = null"
            id="tfe-qb-new-test_repository-cancel"
          />
          <q-btn
            flat
            text-color="primary"
            label="Add"
            style="width: 20%"
            :loading="addLoading"
            type="submit"
            id="tfe-qb-new-test_repository-add"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirmDeletePackage" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to delete package
        <b> {{ selectedPackage.package_name }} </b> ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Ok"
          color="primary"
          @click="deletePackage(selectedPackage.id)"
          :loading="deleteLoading"
        />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirmDeleteRepo" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to delete test repository
        <b> {{ testRepo.name }} </b> ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Ok"
          color="primary"
          @click="deleteTestRepositories()"
          :loading="deleteRepoLoading"
        />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirmUpdateRepo" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to update test repository
        <b> {{ testRepo.name }} </b> ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Ok"
          color="primary"
          @click="editTestRepositories()"
          :loading="editRepoLoading"
        />
        <q-btn
          flat
          text-color="negative"
          label="Cancel"
          @click="closeUpdateConfirm()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent, ref} from "vue"
  import {Notify, Loading} from "quasar"
  import {pathJoin} from "../utils"

  export default defineComponent({
    props: {
      testRepoId: String,
    },
    watch: {
      packageFilter: "totalPageNumber",
    },
    data() {
      return {
        selectedPackage: {},
        pagination: ref({
          sortBy: "desc",
          descending: false,
          page: 1,
          rowsPerPage: 10,
        }),
        newPackageFolderName: "",
        newPackageName: "",
        addNewPackage: false,
        packageFilter: "",
        testRepo: null,
        origTestRepo: null,
        confirmDeletePackage: false,
        confirmDeleteRepo: false,
        confirmUpdateRepo: false,
        tableLoading: false,
        addLoading: false,
        deleteRepoLoading: false,
        editRepoLoading: false,
        deleteLoading: false,
        columns: [
          {
            name: "package_name",
            required: true,
            align: "left",
            label: "Package name",
            field: "package_name",
            sortable: true,
          },
          {
            name: "folder_name",
            required: true,
            label: "Test folder",
            align: "left",
            field: "folder_name",
          },
        ],
      }
    },
    created() {
      this.loadRepository(this.testRepoId)
    },
    methods: {
      totalPageNumber() {
        if (!this.testRepo) return 0
        if (this.$refs.packTable) {
          return Math.ceil(this.$refs.packTable.filteredSortedRows.length / 10)
        }
        return Math.ceil(this.testRepo.packages.length / 10)
      },
      focusSearch() {
        this.$refs.searchField.focus()
      },
      folderURL(repo, folder) {
        return pathJoin([repo.url, repo.tests_dir, folder])
      },
      closeUpdateConfirm() {
        this.testRepo = JSON.parse(JSON.stringify(this.origTestRepo))
        this.confirmUpdateRepo = false
      },
      editTestRepositories() {
        this.editRepoLoading = true
        let data = {
          tests_dir: this.testRepo.tests_dir,
          tests_prefix: this.testRepo.tests_prefix,
        }
        this.$api
          .patch(`/test_repositories/${this.testRepoId}/`, data)
          .then((response) => {
            this.editRepoLoading = false
            this.confirmUpdateRepo = false
            this.loadRepository(this.testRepoId)
          })
          .catch((error) => {
            this.editRepoLoading = false
            if (+String(error.response.status)[0] === 4) {
              let msg = error.response.data.detail[0].msg
              Notify.create({
                message: msg,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            }
          })
      },
      loadRepository(id) {
        Loading.show()
        this.$api
          .get(`/test_repositories/${id}/`)
          .then((response) => {
            Loading.hide()
            this.testRepo = response.data
            this.origTestRepo = JSON.parse(JSON.stringify(this.testRepo))
          })
          .catch((error) => {
            console.log(error)
            Loading.hide()
            Notify.create({
              message: `Failed to load test repository with id: ${id}`,
              type: "negative",
              actions: [{label: "Dismiss", color: "white", handler: () => {}}],
            })
          })
      },
      newPackage() {
        this.addLoading = true
        let url = pathJoin([
          this.testRepo.url,
          this.testRepo.tests_dir,
          this.newPackageFolderName,
        ])
        let data = {
          package_name: this.newPackageName,
          folder_name: this.newPackageFolderName,
          url: url,
        }
        this.$api
          .post(`/test_repositories/${this.testRepoId}/packages/create/`, data)
          .then((response) => {
            this.addLoading = false
            this.addNewPackage = false
            this.loadRepository(this.testRepoId)
            this.newPackageName = ""
            this.newPackageFolderName = ""
          })
          .catch((error) => {
            this.addLoading = false
            if (+String(error.response.status)[0] === 4) {
              let msg = error.response.data.detail[0].msg
              Notify.create({
                message: msg,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            }
          })
      },
      selectDeletingPackage(pack) {
        this.confirmDeletePackage = true
        this.selectedPackage = pack
      },
      deletePackage(id) {
        this.tableLoading = false
        this.loadingTable = true
        this.$api
          .delete(`/test_repositories/packages/${id}/remove/`)
          .then((response) => {
            this.deleteLoading = false
            this.confirmDeletePackage = false
            this.tableLoading = false
            this.selectedPackage = null
            this.loadRepository(this.testRepoId)
          })
          .catch((error) => {
            this.tableLoading = false
            this.deleteLoading = false
            this.selectedPackage = null
            console.log(error)
            if (+String(error.response.status)[0] === 4) {
              Notify.create({
                message: error.response.data.detail,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            }
          })
      },
      deleteTestRepositories() {
        this.deleteRepoLoading = true
        this.$api
          .delete(`/test_repositories/${this.testRepoId}/remove/`)
          .then((response) => {
            this.deleteRepoLoading = false
            this.confirmDeleteRepo = false
            this.$router.push("/test-repositories-feed")
          })
          .catch((error) => {
            this.deleteRepoLoading = false
            if (+String(error.response.status)[0] === 4) {
              Notify.create({
                message: error.response.data.detail,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            } else {
              Notify.create({
                message: `${error.response.status}: ${error.response.statusText}`,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
                ],
              })
            }
          })
      },
    },
  })
</script>

<style scoped>
  .del-btn:hover {
    color: #ff4649;
  }
</style>
