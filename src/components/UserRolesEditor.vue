<template>
  <q-dialog v-model="opened" @hide="close">
    <q-card style="width: 100%;">

      <!-- Title -->
      <q-card-section>
        <div class="text-h5">Edit Team Roles for user <b>{{user.username}}</b></div>
      </q-card-section>

      <q-card-section class="scroll">
          <!-- Team selection -->

            <q-select
                v-model="teamModel"
                :options="options"
                label="Select team"
                use-input
                input-debounce="0"
                @update:model-value="onTeamSelected"
                @filter="teamSelectFilter"
            />

            <SlideTransition>
              <div v-show="activeTeam != noTeam">
                <q-table
                    class="roleTable"
                    :rows="activeTeam.roles"
                    :columns="rolesCols"
                    :rows-per-page-options="[0]"
                    row-key="id"
                    separator="none"
                    hide-header
                    hide-bottom
                    borderless>

                    <template v-slot:top-left>
                      <div class="text-h6">
                        Roles
                      </div>
                    </template>

                    <template v-slot:body="props">
                      <q-tr :props="props">
                        <q-td auto-width>
                          <q-checkbox size="sm" v-model="props.row.enabled" />
                        </q-td>
                        <q-td key="name" :props="props">
                          <div class="text-h7">{{ props.row.name }}</div>
                        </q-td>
                      </q-tr>
                    </template>
                </q-table>
              </div>
            </SlideTransition>

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
import { defineComponent, ref } from 'vue'
import { diff, getFromApi } from '../utils'
import SlideTransition from 'components/SlideTransition.vue'

export default defineComponent({
  components: {
    SlideTransition
  },
  data () {
    return {
      opened: false,
      user: Object,
      // For an easy manipulation of data, we hold
      // all the required info in userTeamRoles:
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

      // We need a noTeam in order to avoid complains
      // from the q-table
      noTeam: {
        id: null,
        name: '',
        roles: []
      },

      teamModel: null,
      options: null,
      teamOptions: [],
      activeTeam: null,

      teamFilter: '',

      rolesCols: [
        { name: 'ticked', align: 'left', field: 'enabled'},
        { name: 'name', align: 'left', field: 'name' },
      ]
    }
  },
  created () {
    this.activeTeam = this.noTeam
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
      // Fill the data in
      this.loadData()
    },

    close () {
      this.teamOptions = [],
      this.activeTeam = this.noTeam
      this.teamModel = null
      this.opened = false
    },

    async loadData () {
      Loading.show({message: 'Loading user roles'})
      this.userTeamRoles = await this.generateUserTeamRoles()
      this.originalUserTeamRoles = JSON.parse(JSON.stringify(this.userTeamRoles))
      this.userTeamRoles.forEach(team => {
        this.teamOptions.push({
          label: team.name,
          id: team.id
        })
        this.options = ref(this.teamOptions)
      })
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

      Promise.all(promises).then(result => {
        let failedPromises = []
        result.forEach(p => {
          if (p.error) {
            failedPromises.push(p)
          }
        })

        if (failedPromises.length === 0) {
          Notify.create({
            message: `Successfully updated the roles of ${this.user.username}`,
            type: 'positive',
            actions: [
              { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
          })
        } else {
          failedPromises.forEach(p => {
            Notify.create({
              message: `Error: Could not ${p.action} the selected roles`,
              type: 'negative',
              actions: [
                // TODO: Maybe add details of the failure(s)?
                { label: 'Dismiss', color: 'white', handler: () => {} }
              ]
            })
          })
        }
        this.close()
      })
    },

    patchRequest(action, updates) {
      return this.$api.patch(`/users/${this.user.id}/roles/${action}`, updates)
        .then(response => {
          return response
        })
        .catch(error => {
          return {
            error: error,
            action: action
          }
        })
    },

    teamSelectFilter (value, update) {
      update(() => {
        this.options = this.teamOptions.filter(t =>
          t.label.toLowerCase().indexOf(value.toLowerCase()) > -1
        )
      })
    },

    onTeamSelected(team) {
      if (team) {
        this.activeTeam = this.userTeamRoles.find(t => t.id === team.id)
      } else {
        this.activeTeam = this.noTeam
      }
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

.roleTable {
  box-shadow: none;
  border: none;
}

</style>
