<template>
    <q-page class="q-px-xl q-pt-md">
        <div class="row justify-center">
            <q-table
                style="width: 80%"
                title="Teams"
                :rows="teams"
                :columns="columns"
                row-key="name"
                :loading="loading"
                :rows-per-page-options="[0]"
                hide-pagination
            >   
                <template v-slot:top-right>
                    <div class="q-gutter-md">
                        <q-btn @click="addNewTeam = true" 
                            icon-right="group_add"
                            no-caps
                            color="green">
                            New
                        </q-btn>
                    </div>
                </template>
                <template v-slot:header="props">
                    <q-tr :props="props">
                        <q-th auto-width />
                        <q-th
                            v-for="col in props.cols"
                            :key="col.name"
                            :props="props"
                        >
                            {{ col.label }}
                        </q-th>
                        <q-th auto-width />
                    </q-tr>
                </template>
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td auto-width>
                            <q-btn flat round icon="info" :to="{path: `/teams/${props.row.id}`, query: { tab: 'members' } }" />
                        </q-td>
                        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                        <q-td key="owner" :props="props">
                            <a :href="`mailto:${props.row.owner.email}`">{{ props.row.owner.username }}</a>
                        </q-td>
                        <q-td key="products" :props="props">
                            <router-link :to="{path: `/teams/${props.row.id}`, query: { tab: 'products' } }">
                                {{ props.row.products.length }}
                            </router-link>
                        </q-td>
                        <q-td key="members" :props="props">
                            <router-link :to="{path: `/teams/${props.row.id}`, query: { tab: 'members' } }">
                                {{ props.row.members.length }}
                            </router-link>
                        </q-td>
                        <q-td auto-width>
                            <q-btn flat round icon="delete" class="del-btn" @click="selectDeletingTeam(props.row)"/>
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
        <div class="row justify-center">
            <q-pagination input :max="totalPages" v-model="currentPage" size="md"/>
        </div>
    </q-page>
    <q-dialog v-model="addNewTeam">
        <q-card style="width: 50%">
            <q-card-section>
                <div class="text-h6">
                    New Team
                    <q-icon name="group_add" color="primary" size="lg" />
                </div>  
            </q-card-section>
            <q-form @submit="newTeam">
                <q-card-section>
                    <q-input v-model="newTeamName" label="Name*" hint="Enter a name for a new team"
                            :rules="[val => !!val || 'Team name is required']"/>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat text-color="negative" label="Cancel"
                        v-close-popup @click="newTeamName = null"/>
                    <q-btn flat text-color="primary" label="Add" style="width: 20%"
                        :loading="addLoading" type="submit">
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
                Are you sure you want to delete team <b> {{ selectedTeam.name }} </b> ?
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat label="Ok" color="primary" @click="deleteTeam(selectedTeam.id)" :loading="loadingDeleteTeam" />
                <q-btn flat text-color="negative" label="Cancel" v-close-popup/>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
import { LocalStorage, Notify } from 'quasar'
import { defineComponent, ref } from 'vue'

export default defineComponent({
    data () {
        return {
            loading: false,
            loadingDeleteTeam: false,
            confirm: false,
            selectedTeam: null,
            totalPages: ref(1),
            teams: [],
            columns: [
                { name: 'name', required: true, align: 'left', label: 'Name', field: 'name'},
                { name: 'owner', required: true, align: 'left', label: 'Owner', field: 'owner'},
                { name: 'products', required: true, align: 'center', label: 'Products', field: 'products' },
                { name: 'members', required: true, align: 'center', label: 'Members', field: 'members' }  
            ],
            addNewTeam: false,
            newTeamName: '',
            addLoading: false
        }
    },
    created () {
        this.loadFeedPage()
    },
    computed: {
        teamsPageNumber () {
            return this.$store.getters['teams/teamsPageNumber']
        },
        currentPage: {
            get () { return this.$store.state.teams.pageNumber },
            set (value) {
                this.$store.commit('teams/setPageNumber', value)
                this.loadFeedPage()
            }
        }
    },
    methods: {
        loadFeedPage () {
            this.loading = true
            let query = {
                pageNumber: this.teamsPageNumber
            }
            this.$api.get(`/teams/`, { params: query })
                .then(response => {
                    this.loading = false
                    this.teams = response.data.teams
                    this.totalPages = Math.ceil(response.data['total_teams'] / 10)
                })
                .catch(error => {
                    this.loading = false
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
        },
        newTeam () {
            this.addLoading = true
            let user = LocalStorage.getItem('user')
            let data = {
                team_name: this.newTeamName,
                user_id: user.user_id
            }
            this.$api.post(`/teams/create/`, data)
                .then(response => {
                    this.addLoading = false
                    this.addNewTeam = false
                    this.loadFeedPage()
                    this.newTeamName = ''
                })
                .catch(error => {
                    this.addLoading = false
                    this.newTeamName = ''
                    if (String(error.response.status)[0] === 4 ){
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
        selectDeletingTeam (team) {
            if (team.products.length !== 0) {
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
            this.selectedTeam = team
        },
        deleteTeam (id) {
            this.loadingDeleteTeam = true
            this.loading = true
            this.$api.delete(`/teams/${id}/remove`)
                .then(response => {
                    this.loadingDeleteTeam = false
                    this.confirm = false
                    this.loading = false
                    this.loadFeedPage()
                })
                .catch(error => {
                    this.loading = false
                    this.loadingDeleteTeam = false
                    if (String(error.response.status)[0] === 4 ){
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
        }
    }
    
})
</script>

<style scoped>
  .del-btn:hover {
      color: #ff4649;
  }
</style>