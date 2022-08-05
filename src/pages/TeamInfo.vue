<template>
    <div class="row justify-center q-col-gutter-sm q-ma-xs q-pl-xl">
        <div style="width: 70%">
            <q-card v-if="team">
                <q-card-section>
                    <div class="text-h6">{{ team.name }}</div>
                    <div class="text-subtitle2">by
                        <a :href="`mailto:${team.owner.email}`">{{ team.owner.username }}</a>
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
                            color="primary"
                            wrap-cells
                            flat
                            style="width: 100%"
                            row-key="id"
                            :filter="filter"
                            hide-pagination
                            :rows-per-page-options=[0]
                            selection="multiple"
                            v-model:selected="selectedMembers">
                            <template v-slot:top-right>
                                <div class="q-gutter-md">
                                    <q-btn flat
                                           round
                                           color="primary"
                                           :loading="loadAddUser"
                                           icon="person_add"
                                           @click="addNewMember = true"
                                    >
                                        <q-tooltip>
                                            Add members
                                        </q-tooltip>
                                    </q-btn>
                                    <q-btn flat
                                           round
                                           color="negative"
                                           :loading="loadRemoveUser"
                                           icon="person_remove"
                                           @click="removeMembers"
                                    >
                                        <q-tooltip>
                                            Remove members
                                        </q-tooltip>
                                    </q-btn>
                                </div>
                                <q-input borderless dense debounce="300" class="q-pl-md" v-model="filter" placeholder="Search">
                                    <template v-slot:append>
                                        <q-icon name="search"/>
                                    </template>
                                </q-input>
                            </template>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td auto-width>
                                        <q-checkbox v-model="props.selected" />
                                    </q-td>
                                    <q-td key="id" :props="props">{{ props.row.id }}</q-td>
                                    <q-td key="username" :props="props">{{ props.row.username}}</q-td>
                                    <q-td key="email" :props="props">
                                        <a :href="`mailto:${props.row.email}`" target="_blank">{{ props.row.email }}</a>
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
                            :rows-per-page-options=[0]>
                            <template v-slot:top-right>
                                <q-input borderless dense debounce="300" class="q-pl-md" v-model="filter" placeholder="Search">
                                    <template v-slot:append>
                                        <q-icon name="search"/>
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
                            :rows-per-page-options=[0]>
                                <template v-slot:top-right>
                                    <q-input borderless dense debounce="300" class="q-pl-md" v-model="filter" placeholder="Search">
                                        <template v-slot:append>
                                            <q-icon name="search"/>
                                        </template>
                                    </q-input>
                                </template>
                            </q-table>
                    </q-tab-panel>
                    </q-tab-panels>
                </q-card-section>

                <q-separator />

                <q-card-actions align="right">
                    <q-btn flat color="negative" @click="confirm = true">Delete Team</q-btn>
                </q-card-actions>
            </q-card>
        </div>
    </div>
    <q-dialog v-model="addNewMember">
        <q-card style="width: 50%;">
            <q-card-section>
                <div class="text-h6">
                    New members
                    <q-icon name="person_add" color="primary" size="lg" />
                </div>
            </q-card-section>
            <q-form @submit="addUsers">
                <q-card-section>
                    <q-select v-model="newMembers" :options="usersOptions" label="Users*" hint="Select users for this team"
                            option-value="id" option-label="username" multiple use-chips
                            input-debounce="0" @filter="userFilter" use-input autofocus
                            ref="userSelect" @add="clearFilter" clearable
                            :rules="[val => usersRule(val) || 'Please select at least one user']" >
                                <template v-slot:no-option>
                                    <q-item>
                                        <q-item-section class="text-italic text-grey">
                                            No users
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat text-color="negative" label="Cancel"
                        v-close-popup @click="newMembers = null"/>
                    <q-btn flat text-color="primary" label="Add" style="width: 20%"
                        :loading="loadAddUser" type="submit">
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
                <q-btn flat label="Ok" color="primary" @click="deleteTeam" :loading="loadingDeleteTeam" />
                <q-btn flat text-color="negative" label="Cancel" v-close-popup/>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
import { Loading, Notify } from 'quasar'
import { defineComponent, ref } from 'vue'

export default defineComponent({
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
                { name: 'id', required: true, align: 'center', label: 'User ID', field: 'id'},
                { name: 'username', required: true, align: 'center', label: 'Username', field: 'username' },
                { name: 'email', required: true, align: 'center', label: 'Email', field: 'email'}
            ],
            addNewMember: false,
            newMembers: [],
            loadAddUser: false,
            loadRemoveUser: false,
            productsCol: [
                { name: 'name', required: true, align: 'center', label: 'Name', field: 'name' },
                { name: 'title', required: true, align: 'left', label: 'Title', field: 'title' }
            ],
            rolesCol: [
                { name: 'name', required: true, align: 'left', label: 'Name', field: 'name' }
            ]
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
                modification: 'add',
                members_to_update: this.newMembers
            }
            this.updateMembers(data)
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
                modification: 'remove',
                members_to_update: this.selectedMembers
            }
            this.updateMembers(data)
        },
        updateMembers (data) {
            this.$api.post(`/teams/${this.teamId}/members/`, data)
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
            this.$api.get(`/teams/${teamId}/`)
                .then(response => {
                    Loading.hide()
                    this.team = response.data
                })
                .catch(error => {
                    Loading.hide()
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
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
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
        }
    }
})
</script>

<style>

</style>