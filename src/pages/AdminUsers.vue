<template>
  <q-page class="q-px-xl q-pt-md">
    <div class="row justify-center">
      <q-table
          style="width: 60%"
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
            <q-btn flat color="negative" icon="person_remove" v-show="usersToRemove.length != 0" @click="confirmDeletion = true">
              <q-tooltip>Remove selected users</q-tooltip>
            </q-btn>
            <q-btn flat color="positive" icon="manage_accounts" v-show="usersToUpdate.length != 0" @click="confirmUpdate = true">
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
          You are about to permanently remove the selected users. Continue?
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
          Are you sure you want to apply the changes to the selected users?
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
                        Notify.create({
                            message: `${error.response.status}: ${error.response.statusText}`,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    })
            })
        },
        updateUsers () {
            let promises = []
            this.usersToUpdate.forEach(user_id => {
                let index = this.users.findIndex(u => u.id === user_id)
                let changes = diff(this.originalUsers[index], this.users[index])
                changes.is_verified = changes.is_active
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
        }
    }
})
</script>
<style>
tr:nth-child(even) {
  background-color: #f5f5f5 !important;
}
</style>
