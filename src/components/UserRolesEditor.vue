<template>
  <q-dialog v-model="opened" @hide="close">
    <q-card style="width: 80%; max-width: 30vw;">

      <!-- Title -->
      <q-card-section>
        <div class="text-h5">Edit Roles for user <b>{{user.username}}</b></div>
      </q-card-section>

      <q-card-section class="scroll">
        <div class="row">

          <!-- Team selection -->
          <div class="col-4">
            <q-table
                :class="teamTableClass"
                title="Teams"
                :rows="userTeamRoles"
                :columns="teamsCols"
                :rows-per-page-options="[0]"
                row-key="id"
                separator="none"
                hide-header
                hide-bottom
                wrap-cells
                borderless>

                <template v-slot:top-left>
                  <div class="text-h6">
                    Teams
                  </div>
                  <q-separator />
                </template>

                <!-- Team Rows -->
                <template v-slot:body="props">
                  <q-tr :props="props" style="cursor: pointer;">
                    <q-td key="name" :props="props" @click="onTeamClick(props.row)">
                      <div><li>{{ props.row.name }}</li></div>
                    </q-td>
                  </q-tr>
                </template>
  
            </q-table>
          </div>
          <!-- Team roles selection -->
          <div class="col-8">
            <q-table class="roleTable"
                title="Roles"
                :rows="activeTeam.roles"
                :columns="rolesCols"
                :rows-per-page-options="[0]"
                row-key="id"
                separator="none"
                hide-header
                hide-bottom
                wrap-cells
                v-if="activeTeam.roles.length > 0"
                borderless>

                <template v-slot:top-left>
                  <div class="text-h6">
                    Roles of {{this.activeTeam.name}} team
                  </div>
                  <q-separator />
                </template>
  
                <!-- Roles Rows -->
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td auto-width>
                      <q-checkbox v-model="props.row.enabled"/>
                    </q-td>
                    <q-td key="name" :props="props">
                      <div class="text-h7">{{ props.row.name }}</div>
                    </q-td>
                  </q-tr>
                </template>
            </q-table>

          </div>
         </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-on:click="close" />
        <q-btn flat label="Save" color="primary" :disabled="saveIsDisabled" v-on:click="saveUserRoles" />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script>
import { Loading, Notify } from 'quasar'
import { defineComponent } from 'vue'
import { diff, getFromApi } from '../utils'

const noTeam = {
  id: null,
  name: '',
  roles: []
}

export default defineComponent({
  data () {
    return {
      opened: false,
      user: Object,
      // For an easy manipulation of data, we hold
      // all the equired info in userTeamRoles:
      // [
      //   { id: int,          // team id
      //     name: str,        // team name
      //     roles: [
      //       { id: int,      // role id
      //         name: str,    // role name
      //         enabled:bool  // if enabled for the user
      //       }
      //   }
      // ]
      userTeamRoles: [],
      originalUserTeamRoles: [],

      allRoles: [],

      teamsCols: [
        { name: 'name', align: 'left', field: 'name' },
      ],
      teamTableClass: 'teamTable',
      rolesCols: [
        { name: 'ticked', align: 'left', field: 'enabled'},
        { name: 'name', align: 'left', field: 'name' },
      ],
      activeTeam: noTeam
    }
  },
  created () {
    this.loadAllRoles()
  },
  computed: {
    saveIsDisabled () {
      let teams = diff(this.originalUserTeamRoles, this.userTeamRoles)

      // Do this differently?
      for (const team in teams) {
        for (const role in teams[team].roles) {
          if (teams[team].roles[role].hasOwnProperty('enabled')) return false
        }
      }
      return true
    }
  },
  methods: {
    open () {
      // Reset previous status
      this.userTeamRoles = []
      this.originalUserTeamRoles = []
      if (this.teamTableClass.includes("teamTableNoRightBorder"))
        this.teamTableClass = this.teamTableClass.replace('teamTableNoRightBorder', '')
      // Fill the data in
      this.loadData()
    },

    close () {
      this.opened = false
      this.activeTeam = noTeam
    },

    async loadData () {
      Loading.show({message: 'Loading user roles'})
      this.userTeamRoles = await this.generateUserTeamRoles()
      this.originalUserTeamRoles = JSON.parse(JSON.stringify(this.userTeamRoles))
      Loading.hide()
      this.opened = true
    },

    async loadAllRoles () {
      this.allRoles = await getFromApi(this.$api, `/roles/`)
    },

    async getUserTeams () {
      return getFromApi(this.$api, `/users/${this.user.id}/teams`)
    },

    async getUserRoles () {
      return getFromApi(this.$api, `/users/${this.user.id}/roles`)
    },

    async generateUserTeamRoles () {
      // TODO: Either we find a way to get the roles differently or
      // show the full role name as appears in the role names, because
      // we will get into problems if a team name includes an underscore
      // and there are many teams that are named similar, i.e.:
      // john_project_one and john_project_two
      let userRoles = await this.getUserRoles()
      let userTeams = await this.getUserTeams()
      let userTeamRoles = []

      userTeams.forEach((team, index) => {
        let roles = []
        this.allRoles.forEach(role => {
          if (role.name.startsWith(team.name)) {
            roles.push({
              id: role.id,
              name: role.name.replace(team.name + '_', ''),
              enabled: userRoles.find(r => r.id === role.id)? true: false
            })
          }
        })
        userTeams[index].roles = roles
        userTeamRoles.push({
          id: userTeams[index].id,
          name: userTeams[index].name,
          roles: roles
        })
      })
      return userTeamRoles
    },

    onTeamClick (team) {
      this.activeTeam = this.userTeamRoles.find(t => t.id === team.id)
      if (!this.teamTableClass.includes("teamTableNoRightBorder"))
        this.teamTableClass += ' teamTableNoRightBorder'
    },

    saveUserRoles () {
      let changes = diff(this.originalUserTeamRoles, this.userTeamRoles)
      let add = [], remove = []
      this.userTeamRoles.forEach((team, teamIndex) => {
        team.roles.forEach((role, roleIndex) => {
          if (changes[teamIndex].roles[roleIndex].hasOwnProperty('enabled'))
            changes[teamIndex].roles[roleIndex].enabled?
              add.push(this.userTeamRoles[teamIndex].roles[roleIndex].id):
              remove.push(this.userTeamRoles[teamIndex].roles[roleIndex].id)
        })
      })
      this.submitChanges(add, remove)
    },

    submitChanges(add, remove) {
      let promises = []
      if (add.length != 0) {
        let promise = this.patchRequest('add', add)
        promises.push(promise)
      }

      if (remove.length != 0) {
        let promise = this.patchRequest('remove', remove)
        promises.push(promise)
      }

      // TODO: Catch when any of the promises returns an error
      Promise.all(promises)
        .then(result => {
          Notify.create({
            message: `Successfully updated the roles of ${this.user.username}`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
          this.close()
        })
    },

    patchRequest(action, updates) {
      return this.$api.patch(`/users/${this.user.id}/roles/${action}`, updates)
        .then(response => {
          return response
        })
        .catch(error => {
          return error
        })
    }
  }
})
</script>


<style scoped>
/* We need to undo the tr style applied in the parent component.
   TODO: Is there a better way to do it?
*/
tr:nth-child(even) {
  background-color: #ffffff !important;
}

.teamTable {
  box-shadow: none;
  border-bottom: inset;
  border-right: inset;
  border-top-style: outset;
  border-left-style: outset;
}

.teamTableNoRightBorder {
  border-right: none;
}

.roleTable {
  box-shadow: none;
  border-bottom: inset;
  border-right: inset;
  border-top-style: outset;
  border-left-style: outset;
}

</style>
