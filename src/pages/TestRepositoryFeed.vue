<template>
  <q-page class="q-px-xl q-pt-md">
    <div class="row justify-center">
      <q-table
        style="width: 95%"
        title="Test Repositories"
        :rows="testRepositories"
        :columns="columns"
        row-key="name"
        :loading="loading"
        :rows-per-page-options="[0]"
        hide-pagination
      >
        <template v-slot:top-right>
          <div class="row q-gutter-sm">
            <q-input
              dense
              rounded
              standout="bg-grey-4"
              v-model="search"
              input-class="text-black"
              class="q-ml-md"
              ref="searchField"
              text-color="black"
              @keydown.enter.prevent="searchRepos()"
            >
              <template v-slot:after>
                <div class="q-gutter-sm">
                  <q-icon
                    v-if="search !== ''"
                    name="close"
                    color="grey"
                    @click="resetFilter()"
                    class="cursor-pointer"
                  >
                    <q-tooltip> Click to clear </q-tooltip>
                  </q-icon>
                  <q-btn
                    round
                    unelevated
                    icon="search"
                    color="primary"
                    :loading="loadingSearch"
                    @click="searchRepos()"
                  />
                </div>
              </template>
            </q-input>
            <div>
              <q-btn
                round
                @click="addNewtestRepositories = true"
                icon="add_circle"
                color="green"
                id="tfe-qb-add-new-test_repository"
              >
                <q-tooltip> Create new test repository </q-tooltip>
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
            <q-td key="name" :props="props">{{ props.row.name }}</q-td>
            <q-td key="url" :props="props">
              <a :href="repoURL(props.row)" target="_blank">{{
                props.row.url
              }}</a>
            </q-td>
            <q-td key="tests_dir" :props="props">
              {{ props.row.tests_dir }}
            </q-td>
            <q-td key="packages" :props="props">
              {{ props.row.packages.length }}
            </q-td>
            <q-td auto-width>
              <q-btn
                flat
                round
                icon="settings"
                :to="{path: `/test-repositories/${props.row.id}`}"
              >
                <q-tooltip> Configure test repository </q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                icon="delete"
                class="del-btn"
                @click="selectDeletingtestRepositories(props.row)"
              >
                <q-tooltip> Delete test repository </q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div class="row justify-center">
      <q-pagination input :max="totalPages" v-model="currentPage" size="md" />
    </div>
  </q-page>
  <q-dialog v-model="addNewtestRepositories">
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Create New Test Repository</div>
      </q-card-section>
      <q-form @submit="newtestRepositories">
        <q-card-section>
          <q-input
            v-model="newtestRepositoriesName"
            label="Name*"
            hint="Enter a name for a new test repository"
            :rules="[(val) => !!val || 'Name is required']"
          />
          <q-input
            v-model="newtestRepositoriesUrl"
            label="URL*"
            hint="Enter a url for a new test repository"
            :rules="[(val) => !!val || 'URL is required']"
          />
          <q-input
            v-model="newtestRepositoriesDir"
            label="Tests directory*"
            hint="Enter a tests directory for a new test repository"
            :rules="[(val) => !!val || 'Tests directory is required']"
          />
          <q-input
            v-model="newtestRepositoriesPrefix"
            label="Tests prefix"
            hint="Enter a tests prefix for a new test repository"
          />
          <q-select
            v-model="current_team"
            label="Select team"
            :rules="[(val) => !!val || 'Team name is required']"
            :options="userTeams"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="negative"
            label="Cancel"
            v-close-popup
            @click="newtestRepositoriesName = null"
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

  <q-dialog v-model="configureTestRepositories" maximized>
    <q-card style="width: 100%">
      <q-card-section>
        <div class="text-h6">Configure Test Repository</div>
      </q-card-section>
      <div class="row" max-width>
        <div style="width: 40%">
          <q-form @submit="editTestRepositories">
            <q-card-section>
              <q-field label="Name" stack-label>
                <template v-slot:control>
                  <div class="self-center full-width no-outline" tabindex="0">
                    {{ selectedtestRepositories.name }}
                  </div>
                </template>
              </q-field>
              <q-field label="URL" stack-label>
                <template v-slot:control>
                  <div class="self-center full-width no-outline" tabindex="0">
                    {{ selectedtestRepositories.url }}
                  </div>
                </template>
              </q-field>
              <q-input
                v-model="selectedtestRepositories.tests_dir"
                label="Tests directory*"
                hint="Enter a new tests directory for the test repository"
                :rules="[(val) => !!val || 'Tests directory is required']"
              />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                flat
                text-color="negative"
                label="Cancel"
                v-close-popup
                @click="newtestRepositoriesName = null"
                id="tfe-qb-new-test_repository-cancel"
              />
              <q-btn
                flat
                text-color="primary"
                label="Update"
                style="width: 20%"
                :loading="addLoading"
                type="submit"
                id="tfe-qb-new-test_repository-add"
              />
            </q-card-actions>
          </q-form>
        </div>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirm" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to delete test repository
        <b> {{ selectedtestRepositories.name }} </b> ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Ok"
          color="primary"
          @click="deletetestRepositories(selectedtestRepositories.id)"
          :loading="loadingDeletetestRepositories"
        />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
  import {Notify} from "quasar"
  import {defineComponent, ref} from "vue"
  import {getFromApi, pathJoin} from "../utils"

  export default defineComponent({
    data() {
      return {
        loading: false,
        loadingSearch: false,
        loadingDeletetestRepositories: false,
        confirm: false,
        selectedtestRepositories: null,
        totalPages: ref(1),
        testRepositories: [],
        columns: [
          {
            name: "name",
            required: true,
            align: "left",
            label: "Name",
            field: "name",
          },
          {
            name: "url",
            required: true,
            align: "center",
            label: "URL",
            field: "url",
          },
          {
            name: "tests_dir",
            required: true,
            align: "left",
            label: "Tests directory",
            field: "tests_dir",
          },
          {
            name: "packages",
            required: false,
            align: "center",
            label: "Packages",
            field: "packages",
          },
        ],
        addNewtestRepositories: false,
        configureTestRepositories: false,
        newtestRepositoriesName: "",
        newtestRepositoriesUrl: "",
        newtestRepositoriesDir: "",
        newtestRepositoriesPrefix: "",
        addLoading: false,
        search: "",
        current_team: null,
        userTeams: [],
      }
    },
    created() {
      this.search = this.$route.query.name ? this.$route.query.name : ""
      this.loadFeedPage(this.search)
    },
    computed: {
      testRepositoriesPageNumber() {
        return this.$store.getters[
          "testRepositories/testRepositoriesPageNumber"
        ]
      },
      currentPage: {
        get() {
          return this.$store.state.testRepositories.pageNumber
        },
        set(value) {
          this.$store.commit("testRepositories/setPageNumber", value)
          this.loadFeedPage()
        },
      },
    },
    methods: {
      repoURL(repo) {
        return pathJoin([repo.url, repo.tests_dir])
      },
      resetFilter() {
        this.search = ""
        this.$refs.searchField.blur()
        if (this.$route.query.name) {
          this.loadFeedPage()
          this.$router.replace({name: "TestRepositoriesFeed"})
        }
      },
      searchRepos() {
        this.$refs.searchField.focus()
        let query = this.$route.query.name ? this.$route.query.name : ""
        if (this.search === query) return

        if (this.search) {
          this.$router.push({
            name: "TestRepositoriesFeed",
            query: {name: this.search},
          })
        } else {
          this.$router.replace({name: "TestRepositoriesFeed"})
        }
        this.loadFeedPage(this.search)
      },
      loadFeedPage(name = "") {
        this.loading = true
        let query = {
          pageNumber: this.testRepositoriesPageNumber,
        }
        if (name) {
          query["name"] = name
          this.loadingSearch = true
        }
        this.$api
          .get(`/test_repositories/`, {params: query})
          .then((response) => {
            this.loading = false
            this.loadingSearch = false
            this.testRepositories = response.data.test_repositories
            this.totalPages = Math.ceil(
              response.data["total_test_repositories"] / 10
            )
          })
          .catch((error) => {
            this.loading = false
            this.loadingSearch = false
            Notify.create({
              message: `${error.response.status}: ${error.response.statusText}`,
              type: "negative",
              actions: [{label: "Dismiss", color: "white", handler: () => {}}],
            })
          })
          let currentUserID = this.$store.state.users.self.user_id
          this.userTeams = []
          getFromApi(this.$api, `/users/${currentUserID}/teams`).then(teams => {
            teams.forEach(team => {
              this.userTeams.push({
                label: team.name,
                id: team.id,
              })
            })
          }).catch()
      },
      newtestRepositories() {
        this.addLoading = true
        let data = {
          name: this.newtestRepositoriesName,
          url: this.newtestRepositoriesUrl,
          tests_dir: this.newtestRepositoriesDir,
          tests_prefix: this.newtestRepositoriesPrefix,
          team_id: this.current_team.id,
          owner_id: this.$store.state.users.self.user_id,
        }
        this.$api
          .post(`/test_repositories/create/`, data)
          .then((response) => {
            this.addLoading = false
            this.addNewtestRepositories = false
            this.loadFeedPage()
            this.newtestRepositoriesName = ""
            this.newtestRepositoriesUrl = ""
            this.newtestRepositoriesDir = ""
            this.newtestRepositoriesPrefix = ""
          })
          .catch((error) => {
            this.addLoading = false
            if (+String(error.response.status)[0] === 4) {
              Notify.create({
                message: error.response.data.detail,
                type: "negative",
                actions: [
                  {label: "Dismiss", color: "white", handler: () => {}},
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
      selectTestRepo(testRepo) {
        this.configureTestRepositories = true
        this.selectedtestRepositories = testRepo
      },
      selectDeletingtestRepositories(testRepository) {
        this.confirm = true
        this.selectedtestRepositories = testRepository
      },
      deletetestRepositories(id) {
        this.loadingDeletetestRepositories = true
        this.loading = true
        this.$api
          .delete(`/test_repositories/${id}/remove/`)
          .then((response) => {
            this.loadingDeletetestRepositories = false
            this.confirm = false
            this.loading = false
            this.selectedtestRepositories = null
            this.loadFeedPage()
          })
          .catch((error) => {
            this.loading = false
            this.loadingDeletetestRepositories = false
            this.selectedtestRepositories = null
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
