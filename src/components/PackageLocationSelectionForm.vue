<template>
    <div class="q-pa-md">
        <q-table
        :title="viewOnly ? 'Package location list' : 'Package location selector'"
        :rows="packagesLocation"
        :columns="columns"
        row-key="id"
        color="primary"
        :loading="loadingTable"
        hide-pagination
        :rows-per-page-options=[0]
        :filter="filter"
        >
            <template v-slot:top-right="props">
                <q-input borderless dense debounce="300" class="q-pr-md" v-model="filter" placeholder="Search">
                    <template v-slot:append>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <div class="q-gutter-md">
                    <q-btn
                        flat round dense
                        :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                        @click="tableFullScreen(props)"
                        class="q-ml-md"
                    />
                    <template v-if="!viewOnly" >
                        <q-btn @click="saveRelease"
                            color="green">
                            Save
                        </q-btn>
                        <q-btn  @click="commitRelease"
                                :loading="loading"
                                color="primary">
                            Commit
                        </q-btn>
                    </template>
                </div>
            </template>
            <template v-slot:header="props">
                <q-tr :props="props">
                <q-th v-for="col in props.cols"
                      :key="col.name" :props="props">
                <q-checkbox v-if="col.name === 'force' && !viewOnly"
                            v-model="forceAll" :disable="loadingTable"
                            size="xs" @click="selectForceAll"/>
                    {{ col.label }}
                </q-th>
                </q-tr>
            </template>
            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td key="nevra" :props="props">
                        {{ props.row.nevra }}
                        <q-badge v-if="props.row.takenFromRepo || props.row.pkgInRepos" color="yellow">
                            <q-tooltip>
                                <span v-if="props.row.takenFromRepo">
                                    This package will be taken from "{{ props.row.takenFromRepo }}" repo<br>
                                </span>
                                <span v-if="props.row.pkgInRepos">
                                    This package exists in the following repos:<br>
                                    <ul v-for="repo in props.row.pkgInRepos" :key="repo">
                                        <li>{{ repo }}</li>
                                    </ul>
                                </span>
                            </q-tooltip>
                        </q-badge>
                    </q-td>
                    <q-td key="destination" :props="props">
                        <q-select v-model="props.row.destination" dense
                            :options="props.row.destinationOptions"
                            :readonly="viewOnly ? true : false"
                            transition-show="scale"
                            transition-hide="scale">
                        </q-select>
                    </q-td>
                    <q-td key="force" :props="props">
                        <q-checkbox v-model="props.row.force" :disable="viewOnly" size="xs" @click="selectForce(props.row)"/>
                    </q-td>
                    <q-td key="trustness" :props="props">
                        <q-badge v-if="viewOnly" color="grey" />
                        <q-badge v-else :color="trustness(props.row) ? 'green': 'negative'" />
                    </q-td>
                    <q-td v-for="arch in archs" :key="arch" :props="props"
                            :class="viewOnly ? null : 'cursor-pointer'" @click="viewOnly ? null : props.row[arch] = !props.row[arch]">
                        <q-icon v-if="props.row[arch]" name="circle" color="primary" />
                        <q-tooltip anchor="center middle" self="center middle"
                                    :class="props.row[arch] ? 'bg-primary' : null"
                                    transition-show="scale" transition-hide="scale">
                            {{ arch }}
                        </q-tooltip>
                    </q-td>
                    <q-td v-if="!viewOnly" key="button" :props="props">
                        <div class="text-grey-8 q-gutter-xs">
                            <q-btn class="add-btn" flat dense round icon="add" @click="addPackage(props.row)" />
                            <q-btn class="del-btn" flat dense round icon="delete" @click="deletePackage(props.row)"/>
                        </div>
                    </q-td>
                </q-tr>
            </template>
        </q-table>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'

export default defineComponent({
    props: {
        release: Object,
        viewOnly: Boolean
    },
    data() {
        return {
            columns: [
                {
                    name: 'nevra',
                    required: true,
                    label: 'Package',
                    align: 'left',
                    field: 'nevra',
                    format: val => `${val}`,
                    sortable: true
                },
                { name: 'destination', align: 'left', label: 'Destination(s)', field: 'destination' },
                { name: 'force', align: 'left', label: 'Force', field: 'force' },
                { name: 'trustness', label: 'Trustness', field: 'trustness', align: 'center', sortable: true },
                { name: 'src', label: 'src', field: 'src', align: 'center' },
                { name: 'i686', label: 'i686', field: 'i686', align: 'center' },
                { name: 'x86_64', label: 'x86_64', field: 'x86_64', align: 'center' },
                { name: 'aarch64', label: 'aarch64', field: 'aarch64', align: 'center' },
                { name: 'ppc64le', label: 'ppc64le', field: 'ppc64le', align: 'center' },
                { name: 'button', label: '', field: 'button', align: 'center'}
            ],
            archs: ['src', 'i686', 'x86_64', 'aarch64', 'ppc64le'],
            filter: '',
            loadingTable: true,
            packagesLocation: [],
            releaseId: null,
            repositories: {},
            loading: false,
            selected: [],
            forceAll: false
        }
    },
    created () {
        if (this.viewOnly) this.createTable(JSON.parse(JSON.stringify(this.release)))  
    },
    methods: {
        tableFullScreen(props){
            props.toggleFullscreen()
        },
        nevra (pack) {
            return `${pack.epoch}:${pack.name}-${pack.version}-${pack.release}.${pack.arch}`
        },
        createTable(data){
            this.build_ids = data.build_ids
            this.build_task_ids = data.build_task_ids
            let packages = data.plan.packages
            this.releaseId = data.id
            this.orig_repos = data.plan.repositories
            this.modules = data.plan.modules
            this.packagesLocation = []
            for (const item of packages) {
                let pack = item.package
                pack.trustRepos = item.repositories
                pack.nevra = this.nevra(pack)
                let pkgInRepos = data.plan.packages_in_repos ? data.plan.packages_in_repos[pack.full_name]: undefined
                let repoId = data.plan.packages_in_repos ? data.plan.packages_from_repos[pack.full_name]: undefined
                if (repoId !== undefined) {
                    pack.takenFromRepo = this.orig_repos.map(repo => {
                        if (repoId === repo.id) {
                            return `${repo.name}-${repo.debug ? 'debug-': ''}${repo.arch}`
                        }
                    }).filter(value => value !== undefined).join()
                }
                if (pkgInRepos !== undefined) {
                    pack.pkgInRepos = [...this.orig_repos.map(repo => {
                        if (pkgInRepos.includes(repo.id)) {
                            return `${repo.name}-${repo.debug ? 'debug-': ''}${repo.arch}`
                        }
                    }).filter(value => value !== undefined)]
                }
                pack.destinationOptions = this.reposOptions(data.plan.repositories, pack.arch)
                this.beholderRepo(item)
                this.selectForce(pack)
                switch (pack.arch) {
                    case 'noarch':
                        pack.i686 = true
                        pack.x86_64 = true
                        pack.aarch64 = true
                        pack.ppc64le = true
                        break;
                    case 'i686':
                        // left this for old releases
                        pack.i686 = true
                        pack.x86_64 = true
                        if (pack.is_multilib !== undefined) {
                            pack.x86_64 = pack.is_multilib
                            if (!pack.is_multilib) {
                                repo_arch = item.repositories[0].arch
                                if (repo_arch !== undefined && repo_arch == 'x86_64') {
                                    pack.i686 = false
                                    pack.x86_64 = true
                                }
                            }
                        }
                        break;
                    default:
                        pack[pack.arch] = true
                        break;
                }
                this.packagesLocation.push(pack)
            }
            this.loadingTable = false
        },
        beholderRepo (data){
            if (data.repositories.length) {
                if (!data.repositories[0]) return

                for (const index in data.package.destinationOptions){
                    if (data.package.destinationOptions[index].label == data.repositories[0].name) {
                        data.package.destination = data.package.destinationOptions[index]
                    }
                }
            }
        },
        reposOptions (repos, arch){
            let reposNames = new Set
            this.repositories = {}
            
            repos.forEach(rep => {
                switch (arch) {
                    case 'noarch':
                        reposNames.add(rep.name)
                        break;
                    case 'i686':
                        if (rep.arch === 'i686' || rep.arch === 'x86_64'){
                            reposNames.add(rep.name)
                        }
                        break;
                    default:
                        if (rep.arch === arch){
                            reposNames.add(rep.name)
                        }
                        break;
                }
                
                if (!this.repositories[rep.arch]) this.repositories[rep.arch] = {}
                this.repositories[rep.arch][rep.name] = rep
            })

            return Array.from(reposNames, repName => {
                return { label: repName, value: repName }
            })
        },
        selectForceAll (){
            if (this.viewOnly) return

            this.selected = this.forceAll ? this.packagesLocation : []
            this.packagesLocation.forEach (pack => {
                pack.force = this.forceAll
            })
        },
        selectForce (row) {
            if (this.viewOnly) return

            if (row.force){
                this.selected.push(row)
            } else {
                let index = this.selected.indexOf(row)
                this.selected = [ ...this.selected.slice(0, index), ...this.selected.slice(index + 1) ]
            }
            switch (this.selected.length) {
                case this.packagesLocation.length:
                    this.forceAll = true
                    break;
                case 0:
                    this.forceAll = false
                    break;
                default:
                    this.forceAll = null
                    break;
            }
        },
        trustness (pack) {
            let trustness = false
            if (pack.trustRepos.length) {
                pack.trustRepos.forEach ( repo => {
                    if (!repo) return
                    if (repo.name === pack.destination.value) trustness = true
                })
            }
            return trustness
        },
        deletePackage(item) {
            let index = this.packagesLocation.indexOf(item)
            this.packagesLocation = [ ...this.packagesLocation.slice(0, index), ...this.packagesLocation.slice(index + 1) ]
        },
        addPackage (item){
            if (item.destination){
                let index = this.packagesLocation.indexOf(item)
                let row = JSON.parse(JSON.stringify(item))
                row.destination = ''
                this.packagesLocation.splice(index + 1, 0, row)
            }
        },
        getPlan() {
            let plan = {
                packages: [],
                modules: this.modules,
                repositories: this.orig_repos
            }
            this.packagesLocation.forEach(packLocation => {
                let repos = []
                let pack = {
                    arch: packLocation.arch,
                    artifact_href: packLocation.artifact_href,
                    href_from_repo: packLocation.href_from_repo,
                    epoch: packLocation.epoch,
                    full_name: packLocation.full_name,
                    name: packLocation.name,
                    force: packLocation.force,
                    release: packLocation.release,
                    version: packLocation.version
                }
                this.archs.forEach(arch => {
                    if (packLocation[arch] && this.repositories[arch] && packLocation.destination) {
                        if (this.repositories[arch][packLocation.destination.value]) repos.push(this.repositories[arch][packLocation.destination.value])
                    }
                })
                plan.packages.push({ package: pack, repositories: repos })
            })
            return plan
        },
        saveRelease () {
            this.$api.put(`/releases/${this.releaseId}/`, { plan: this.getPlan() })
                .then(response => {
                     Notify.create({message: `Release ${response.data.id} updated`, type: 'positive',
                        actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                })
                .catch(error => {
                    Notify.create({message: 'Unable to update a release', type: 'negative',
                        actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                })
        },
        commitRelease () {
            this.loading = true
            this.$api.put(`/releases/${this.releaseId}/`, { plan: this.getPlan() })
                .then(response => {
                    this.$api.post(`/releases/${response.data.id}/commit/`)
                        .then(response => {
                            this.loading = false
                            if (response.data.release.status === 4){
                                Notify.create({message: response.data.message, type: 'negative',
                                    actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                                this.$router.push(`/release-feed`)
                            } else {
                                Notify.create({message: response.data.message, type: 'positive',
                                    actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                                this.$router.push(`/release-feed`)
                            }
                            
                        })
                        .catch(error => {
                            this.loading = false
                            Notify.create({message: 'Unable to commit a release', type: 'negative',
                                actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                        })
                })
                .catch(error => {
                    this.loading = false
                    Notify.create({message: 'Unable to commit a release', type: 'negative',
                                actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                })
            
        } 
    }
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
