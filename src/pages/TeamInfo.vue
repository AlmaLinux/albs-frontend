<template>
  <div class="row justify-center q-col-gutter-sm q-ma-xs q-pl-xl">
    <div style="width: 70%">
      <q-card v-if="team">
        <q-card-section>
          <div class="text-h6">{{ team.name }}</div>
          <div class="text-subtitle2">
            by
            <a
              :href="`mailto:${team.owner.email}`"
              >{{ team.owner.username }}</a
            >
          </div>
        </q-card-section>

        <q-card-section>
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-route-tab
              icon="group"
              :to="{ query: { tab: 'members' } }"
              name="members"
              label="Members"
              exact
              replace
            />
            <q-route-tab
              icon="category"
              :to="{ query: { tab: 'products' } }"
              name="products"
              label="Products"
              exact
              replace
            />
            <q-route-tab
              icon="manage_accounts"
              name="roles"
              :to="{ query: { tab: 'roles' } }"
              label="Roles"
              exact
              replace
            />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="members">
              <q-table
                :rows="team.members"
                :columns="membersCol"
                :visibleColumns="visibleMembersCols"
                color="primary"
                wrap-cells
                flat
                style="width: 100%"
                row-key="id"
                :filter="filter"
                hide-pagination
                :rows-per-page-options="[0]"
                :selection="userAuthenticated() ? 'multiple' : null"
                v-model:selected="selectedMembers"
                no-data-label="No members"
              >
                <template v-slot:top-right>
                  <div v-if="userAuthenticated()" class="q-gutter-md">
                    <q-btn
                      flat
                      round
                      color="primary"
                      :loading="loadAddUser"
                      icon="person_add"
                      @click="addNewMember = true"
                      id="tin-qb-add-new-member"
                    >
                      <q-tooltip> Add members </q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      color="negative"
                      :loading="loadRemoveUser"
                      icon="person_remove"
                      @click="removeMembers"
                      id="tin-qb-remove-member"
                    >
                      <q-tooltip> Remove members </q-tooltip>
                    </q-btn>
                  </div>
                  <q-input
                    borderless
                    dense
                    debounce="300"
                    class="q-pl-md"
                    v-model="filter"
                    placeholder="Search"
                  >
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </template>
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td v-if="userAuthenticated()" auto-width>
                      <q-checkbox v-model="props.selected" />
                    </q-td>
                    <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                    <q-td
                      key="username"
                      :props="props"
                      >{{ props.row.username}}</q-td
                    >
                    <q-td key="email" :props="props">
                      <a
                        :href="`mailto:${props.row.email}`"
                        target="_blank"
                        >{{ props.row.email }}</a
                      >
                    </q-td>
                    <q-td v-show="canEditRoles" style="text-align:center;">
                      <q-btn
                        dense
                        flat
                        round
                        field="edit"
                        icon="edit"
                        v-on:click="editUserRoles(props.row)"
                      ></q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-tab-panel>

            <q-tab-panel name="products">
              <q-table
                :rows="team.products"
                :columns="productsCol"
                color="primary"
                wrap-cells
                flat
                style="width: 100%"
                row-key="id"
                :filter="filter"
                hide-pagination
                :rows-per-page-options="[0]"
                no-data-label="No products yet"
              >
                <template v-slot:top-right>
                  <q-input
                    borderless
                    dense
                    debounce="300"
                    class="q-pl-md"
                    v-model="filter"
                    placeholder="Search"
                  >
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </template>
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td key="name" :props="props">
                      <router-link :to="{ path: `/product/${props.row.id}` }">
                        {{ props.row.name }}
                      </router-link>
                    </q-td>
                    <q-td key="name" :props="props" class="text-left">
                      {{ props.row.title }}
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-tab-panel>

            <q-tab-panel name="roles">
              <q-table
                :rows="team.roles"
                :columns="rolesCol"
                color="primary"
                wrap-cells
                flat
                style="width: 100%"
                row-key="id"
                :filter="filter"
                hide-pagination
                :rows-per-page-options="[0]"
              >
                <template v-slot:top-right>
                  <q-input
                    borderless
                    dense
                    debounce="300"
                    class="q-pl-md"
                    v-model="filter"
                    placeholder="Search"
                  >
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </template>
              </q-table>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
        <div v-if="userAuthenticated()">
          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="negative" @click="checkDeleting()">
              Delete Team
            </q-btn>
          </q-card-actions>
        </div>
      </q-card>
    </div>
  </div>
  <q-dialog v-model="addNewMember">
    <q-card style="width: 50%;">
      <q-card-section>
        <div class="text-h6">
          New members
          <q-icon
            name="person_add"
            color="primary"
            size="lg"
            id="tin-qi-add-member-arrow"
          />
        </div>
      </q-card-section>
      <q-form @submit="addUsers">
        <q-card-section>
          <q-select
            v-model="newMembers"
            :options="usersOptions"
            label="Users*"
            hint="Select users for this team"
            option-value="id"
            option-label="username"
            multiple
            use-chips
            input-debounce="0"
            @filter="userFilter"
            use-input
            autofocus
            ref="userSelect"
            @add="clearFilter"
            clearable
            :rules="[val => usersRule(val) || 'Please select at least one user']"
            id="tin-qs-add-member"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section
                  class="text-italic text-grey"
                  id="tin-qi-section-add-member"
                >
                  No users
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="negative"
            label="Cancel"
            v-close-popup
            @click="newMembers = null"
            id="tin-qb-add-member-cancel"
          />
          <q-btn
            flat
            text-color="primary"
            label="Add"
            style="width: 20%"
            :loading="loadAddUser"
            type="submit"
            id="tin-qb-add-member-add"
          >
          </q-btn>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
  <q-dialog v-model="confirm" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to delete the team ?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Ok"
          color="primary"
          @click="deleteTeam"
          :loading="loadingDeleteTeam"
        />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <UserRolesEditor v-if="userAuthenticated()" ref="userRolesEditor" />
</template>

<script>
  import { Loading, Notify } from 'quasar'
  import { defineComponent, ref } from 'vue'
  import { getFromApi } from '../utils'
  import UserRolesEditor from 'components/UserRolesEditor.vue'

  export default defineComponent({
    components: {
        UserRolesEditor
    },
    props: {
        teamId: String
    },
    data() {
      return {
        team: null,
        tab: ref(this.$route.query.tab),
        loadingDeleteTeam: false,
        confirm: false,
        selectedMembers: [],
        filter: '',
        usersOptions: ref([]),
        membersCol: [
            {
              name: 'id',
              required: true,
              align: 'center',
              label: 'User ID',
              field: 'id'
            },
            {
              name: 'username',
              required: true,
              align: 'center',
              label: 'Username',
              field: 'username'
            },
            {
              name: 'email',
              required: true,
              align: 'center',
              label: 'Email',
              field: 'email'
            },
            {
              name: 'roles',
              requird: true,
              align: 'center',
              label: 'User Roles',
              field: 'id'
            }
        ],
        visibleMembersCols: ['id', 'username', 'email'],
        addNewMember: false,
        newMembers: [],
        loadAddUser: false,
        loadRemoveUser: false,
        productsCol: [
            {
              name: 'name',
              required: true,
              align: 'center',
              label: 'Name',
              field: 'name'
            },
            {
              name: 'title',
              required: true,
              align: 'left',
              label: 'Title',
              field: 'title'
            }
        ],
        rolesCol: [
            {
              name: 'name',
              required: true,
              align: 'left',
              label: 'Name',
              field: 'name'
            }
        ],
        canEditRoles: false
      }
    },
    created () {
      this.loadTeam(this.teamId)
    },
    mounted() {
      /* put focus on active q-route-tab already fixed in latest version of quasar
      but in the current version it does not work correctly */
      setTimeout(() => {
          if (this.$route.query.tab)
              this.tab = this.$route.query.tab
      }, 500)
    },
    computed: {
      allUsers () {
          return this.$store.state.users.users.filter(user => {
              let index = this.team.members.findIndex(member => member.id === user.id)
              return index === -1
          })
      }
    },
    methods: {
      userAuthenticated () {
        return this.$store.getters.isAuthenticated
      },
      userFilter (val, update, abort) {
          update(() => {
              const needle = val.toLocaleLowerCase()
              this.usersOptions = this.allUsers.filter(v => v.username.toLocaleLowerCase().indexOf(needle) > -1)
          })
          abort(() => {
              val = ''
          })
      },
      clearFilter () {
          if (this.$refs.userSelect !== void 0) {
              this.$refs.userSelect.updateInputValue('')
          }
      },
      usersRule (val) {
          return val ? val.length !== 0  : false
      },
      addUsers () {
          this.loadAddUser = true
          let data = {
              members_to_update: this.newMembers
          }
          this.updateMembers(data, 'add')
      },
      removeMembers () {
            if (this.selectedMembers.length === 0) {
              Notify.create({
                  message: 'Please select at least one member',
                  type: 'negative',
                  actions: [
                      { label: 'Dismiss', color: 'white', handler: () => {} }
                  ]
              })
              return
          }

          this.loadRemoveUser = true
          let data = {
              members_to_update: this.selectedMembers
          }
          this.updateMembers(data, 'remove')
      },
      updateMembers (data, modification) {
          this.$api.post(`/teams/${this.teamId}/members/${modification}/`, data)
              .then(response => {
                  this.loadAddUser = false
                  this.loadRemoveUser = false
                  this.addNewMember = false
                  this.newMembers = null
                  this.selectedMembers = []
                  this.team = response.data
              })
              .catch(error => {
                  this.loadAddUser = false
                  this.loadRemoveUser = false
                  Notify.create({
                      message: `${error.response.status}: ${error.response.statusText}`,
                      type: 'negative',
                      actions: [
                          { label: 'Dismiss', color: 'white', handler: () => {} }
                      ]
                  })
              })
      },
      loadTeam (teamId) {
          Loading.show()
          return this.$api.get(`/teams/${teamId}/`)
              .then(response => {
                  Loading.hide()
                  this.team = response.data
                  this.setCanEditRoles()
              })
              .catch(error => {
                  Loading.hide()
                  if (+String(error.response.status)[0] === 4 ){
                      Notify.create({
                          message: error.response.data.detail, type: 'negative',
                          actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
                      })
                  } else {
                      Notify.create({
                          message: `${error.response.status}: ${error.response.statusText}`,
                          type: 'negative',
                          actions: [
                              { label: 'Dismiss', color: 'white', handler: () => {} }
                          ]
                      })
                  }
              })
      },
      checkDeleting () {
          if (this.team.products.length !== 0) {
              Notify.create({
                  message: 'First you need to remove the products',
                  type: 'negative',
                  actions: [
                      { label: 'Dismiss', color: 'white', handler: () => {} }
                  ]
              })
              return
          }

          this.confirm = true
      },
      deleteTeam () {
          this.loadingDeleteTeam = true
          this.$api.delete(`/teams/${this.teamId}/remove`)
              .then(response => {
                  this.confirm = false
                  this.loadingDeleteTeam = false
                  this.$router.push(`/team-feed`)
              })
              .catch(error => {
                  this.loadingDeleteTeam = false
                  if (+String(error.response.status)[0] === 4 ){
                      Notify.create({
                          message: error.response.data.detail, type: 'negative',
                          actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
                      })
                  } else {
                      Notify.create({
                          message: `${error.response.status}: ${error.response.statusText}`,
                          type: 'negative',
                          actions: [
                              { label: 'Dismiss', color: 'white', handler: () => {} }
                          ]
                      })
                  }
              })
      },
      async getUserRoles (userId) {
          return getFromApi(this.$api, `/users/${userId}/roles`)
      },
      async setCanEditRoles () {
          if (!this.userAuthenticated()) {
            return
          }
          // We only allow managers, team owners and superusers
          // to edit the roles of the team members
          let canEdit = false
          let currentUserId = this.$store.state.users.self.user_id

          // superuser
          if (this.$store.state.users.isAdmin) canEdit = true
          // team owner
          if (currentUserId == this.team.owner.id) canEdit = true

          let managerRole = this.team.roles.find(role =>
              role.name == `${this.team.name}_manager`
          )

          let userRoles = await this.getUserRoles(currentUserId)
          // team manager
          if (userRoles.find(role => role.id == managerRole.id)) canEdit = true
          this.canEditRoles = canEdit

          // Show the roles column
          if (canEdit) this.visibleMembersCols.push('roles')
      },
      editUserRoles(user) {
        this.$refs.userRolesEditor.user = user
        this.$refs.userRolesEditor.teamId = this.teamId
        this.$refs.userRolesEditor.open()
      }
    }
  })
</script>

<style></style>
