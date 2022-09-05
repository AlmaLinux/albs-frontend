<template>
  <q-page class="q-px-xl q-pt-md">
    <div class="row justify-center">
      <q-table
          style="width: 80%"
          title="Users"
          :rows="users"
          :columns="columns"
          :filter="filter"
          row-key="id"
          :loading="loadingTable"
          selection="multiple"
          v-model:selected="usersToRemove"
          v-model:pagination="pagination"
          wrap-cells>

          <!-- Remove button, search box  -->
          <template v-slot:top-right>
            <q-btn flat color="negative" icon="person_remove" v-show="usersToRemove.length != 0" @click="confirmDeletion = true" label="Remove selected users">
              <q-tooltip>Remove selected users</q-tooltip>
            </q-btn>
            <q-btn flat color="positive" icon="manage_accounts" v-show="usersToUpdate.length != 0" @click="confirmUpdate = true" label="Save changes">
              <q-tooltip>Update selected users</q-tooltip>
            </q-btn>
            <q-input borderless dense debounce="300" class="q-pl-md" v-model="filter" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search"/>
              </template>
            </q-input>
          </template>

          <!-- Column headers -->
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <!-- Rows -->
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-checkbox v-model="props.selected" />
              </q-td>
              <!--
              <q-td key="id" :props="props">{{ props.row.id }}</q-td>
              -->
              <q-td key="username" :props="props">{{ props.row.username }}</q-td>
              <q-td key="email" :props="props">
                <a :href="`mailto:${props.row.email}`" target="_blank">{{ props.row.email }}</a>
              </q-td>
              <q-td key="isActive" :props="props">
                <q-checkbox v-model="props.row.is_active" v-on:click="userPropertyChanged(props.row)" />
              </q-td>
              <q-td key="isSuperuser" :props="props">
                <q-checkbox v-model="props.row.is_superuser" v-on:click="userPropertyChanged(props.row)" />
              </q-td>
            </q-tr>
          </template>

      </q-table>
    </div>
  </q-page>

  <!-- Remove user(s) confirm dialog -->
  <q-dialog v-model="confirmDeletion" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        You are about to permanently remove the selected users:
        <ul>
          <li v-for="user in usersToRemove" :key="user.id">
            {{ user.username }}
          </li>
        </ul>
        Are you sure?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Continue" color="primary" @click="removeUsers()" v-close-popup />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changes to users' properties confirm dialog -->
  <q-dialog v-model="confirmUpdate" persistent>
    <q-card style="width: 50%">
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section>
        Please confirm that you want to perform the following changes
        <ul>
          <li v-for="user in generateUpdateSummary()" :key="user.username">
            {{ user.username }}:
              <ul>
                <li v-for="(val, key) in user.changes" :key="key">
                  <div>
                    Set <i>{{ key }}</i> to {{ val }}
                  </div>
                </li>
              </ul>
          </li>
        </ul>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Continue" color="primary" @click="updateUsers()" v-close-popup />
        <q-btn flat text-color="negative" label="Cancel" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script>
import { Loading, Notify } from 'quasar'
import { defineComponent, ref } from 'vue'
import { diff } from '../utils'

export default defineComponent({
    data() {
        return {
            // user list related
            originalUsers: [], // keep an unaltered list of users
            users: [],
            columns: [
                { name: 'select', required: true, align: 'center', label: '', field: 'id'},
            //    { name: 'id', required: true, align: 'center', label: 'Id', field: 'id'},
                { name: 'username', required: true, align: 'center', label: 'Username', field: 'username' },
                { name: 'email', required: true, align: 'center', label: 'Email', field: 'email'},
                { name: 'isActive', required: true, align: 'center', label: 'Enabled', field: 'is_active' },
                { name: 'isSuperuser', required: true, align: 'center', label: 'Superuser', field: 'is_superuser' }
            ],
            loadingTable: false,
            pagination: ref({
                rowsPerPage: 10,
                page: 1
            }),
            // search related
            filter: ref(''),
            // user deletion related
            usersToRemove: [],
            confirmDeletion: false,
            // user updates related
            usersToUpdate: [],
            confirmUpdate: false,
        }
    },

    created () {
        this.loadUsers()
        // TODO: Explore the possibilities to achieve this ala vue-router way,
        // because the in-component guards beforeRouteLeave and beforeRouteUpdate
        // are not working out of the box. For now, we're using the browsers'
        // stock leave site confirmation dialogs.
        window.addEventListener('beforeunload', (event) => {
          event.preventDefault()
          if (this.usersToUpdate.length != 0 || this.usersToRemove != 0) {
            // We need to set returnValue in order for chrome to show the pop up
            event.returnValue = "Unsaved changes"
            return
          }
        })
    },

    methods: {
        loadUsers () {
            Loading.show()
            this.$api.get(`/users/all_users`)
              .then(response => {
                  Loading.hide()
                  this.users = response.data
                  // Deep copy the users list
                  this.originalUsers = JSON.parse(JSON.stringify(this.users))
                  this.usersToRemove = []
                  this.usersToUpdate = []
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

        userPropertyChanged (user) {
            let alreadyIncluded = this.usersToUpdate.indexOf(user.id)
            if (alreadyIncluded !== -1) {
                let index = this.users.findIndex(u => u.id === user.id)
                let changes = diff(this.originalUsers[index], this.users[index])
                if (Object.keys(changes).length === 0) {
                    this.usersToUpdate.splice(alreadyIncluded, 1)
                }
            } else {
                this.usersToUpdate.push(user.id)
            }
        },

        // This method generates a JSON object that can be easily rendered in the
        // update users confirmation dialog
        generateUpdateSummary () {
            let summary = []
            this.usersToUpdate.forEach(user_id => {
                let update = {}
                let index = this.users.findIndex(u => u.id === user_id)
                update.changes = diff(this.originalUsers[index], this.users[index])
                // We do this rename to ensure consistency with UI, which uses
                // the term 'enabled'
                if (update.changes.hasOwnProperty('is_active')) {
                  update.changes.is_enabled = update.changes.is_active
                  delete update.changes.is_active
                }
                update.username = this.users[index].username
                summary.push(update)
            })
            return summary
        },

        updateUsers () {
            let promises = []
            this.usersToUpdate.forEach(user_id => {
                let index = this.users.findIndex(u => u.id === user_id)
                let changes = diff(this.originalUsers[index], this.users[index])
                if (changes.hasOwnProperty('is_active')) changes.is_verified = changes.is_active
                changes.id = user_id

                let promise = this.$api.put(`/users/${user_id}`, changes)
                    .then(response => {
                        return response
                    })
                    .catch(error => {
                        return error
                    })
                promises.push(promise)
            })
            Promise.all(promises)
                .then(result => {
                    // TODO: Catch when any of the promises returns an error
                    Notify.create({
                        message: 'Successfully updated all user(s) properties',
                        type: 'positive',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                    this.loadUsers()
                })
        },

        removeUsers () {
            this.usersToRemove.forEach(user => {
                this.$api.delete(`/users/${user.id}/remove`)
                    .then(response => {
                        Notify.create({
                            message: `Successfully removed user ${user.username}`,
                            type: 'positive',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                        this.loadUsers()
                    })
                    .catch(error => {
                        // TODO: Provide useful errors for each deletion
                        Notify.create({
                            message: `${error.response.status}: ${error.response.statusText}`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    })
            })
        }
    }
})
</script>
<style>
tr:nth-child(even) {
  background-color: #f5f5f5 !important;
}
</style>
