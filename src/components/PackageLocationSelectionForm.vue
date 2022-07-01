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
                <q-checkbox v-if="col.name === 'force_not_notarized' && !viewOnly"
                            v-model="forceNotNotarizedAll" :disable="loadingTable"
                            size="xs" @click="selectNotNotarizedAll"/>
                    {{ col.label }}
                </q-th>
                </q-tr>
            </template>
            <template v-if="modules && modules.length" v-slot:top-row>
                <q-tr>
                    <q-th colspan="100%" class="text-left">
                        Packages
                    </q-th>
                </q-tr>
            </template>
            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td key="nevra" :props="props">
                        {{ props.row.nevra }}
                        <q-badge v-if="!props.row.cas_hash" color="white" align="bottom" class="cursor-pointer">
                            <q-icon size="xs" name="key_off" color="negative">
                            <q-tooltip>
                                Package is not notarized
                            </q-tooltip>
                            </q-icon>
                        </q-badge>
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
                    <q-td key="force_not_notarized" :props="props" v-if="!props.row.cas_hash">
                        <q-checkbox v-model="props.row.force_not_notarized"
                            :disable="viewOnly && !props.row.cas_hash"
                            size="xs" @click="selectNotNotarized(props.row)"/>
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
            <template v-if="modules && modules.length" v-slot:bottom-row>
                <q-tr>
                    <q-th colspan="100%" class="text-left">
                        Modules
                    </q-th>
                </q-tr>
                <q-tr v-for="build_module in modules" :key="build_module.arch">
                    <q-td>
                        {{ build_module.nsvca }}
                    </q-td>
                    <q-td>
                        <q-select v-model="build_module.destination" dense
                            :options="build_module.destinationOptions"
                            :readonly="viewOnly ? true : false"
                            transition-show="scale"
                            transition-hide="scale">
                        </q-select>
                    </q-td>
                    <q-td>
                        <q-checkbox v-model="build_module.force" disable size="xs">
                            <q-tooltip>
                                Module cannot be force-released
                            </q-tooltip>
                        </q-checkbox>
                    </q-td>
                    <q-td class="text-center">
                        <q-badge v-if="viewOnly" color="grey" />
                        <q-badge v-else :color="trustness(build_module) ? 'green': 'negative'" />
                    </q-td>
                    <q-td v-for="arch in archs" :key="arch"
                            :class="viewOnly || arch === 'src' ? null : 'cursor-pointer'" class="text-center"
                            @click="viewOnly || arch === 'src' ? null : build_module[arch] = !build_module[arch]">
                        <q-icon v-if="build_module[arch]" name="circle" color="primary" />
                        <q-tooltip anchor="center middle" self="center middle"
                                    :class="build_module[arch] ? 'bg-primary' : null"
                                    transition-show="scale" transition-hide="scale">
                            {{ arch }}
                        </q-tooltip>
                    </q-td>
                    <q-td v-if="!viewOnly">
                        <div class="text-grey-8 q-gutter-xs">
                            <q-btn class="add-btn" flat dense round icon="add" @click="addModule(build_module)" />
                            <q-btn class="del-btn" flat dense round icon="delete" @click="deleteModule(build_module)"/>
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
import { nsvca } from '../utils';

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
                    label: 'NEVRA',
                    align: 'left',
                    field: 'nevra',
                    format: val => `${val}`,
                    sortable: true
                },
                { name: 'destination', align: 'left', label: 'Destination(s)', field: 'destination' },
                { name: 'force', align: 'left', label: 'Force', field: 'force' },
                { name: 'trustness', label: 'Trustness', field: 'trustness', align: 'center', sortable: true }
            ],
            archs: ['src'],
            filter: '',
            loadingTable: true,
            packagesLocation: [],
            releaseId: null,
            repositories: {},
            loading: false,
            selected: [],
            selectedNotNotarized: [],
            forceAll: false,
            forceNotNotarizedAll: false,
            modules: []
        }
    },
    created () {
        if (this.viewOnly) this.createTable(JSON.parse(JSON.stringify(this.release)))  
    },
    methods: {
        nsvca: nsvca,
        tableFullScreen(props){
            props.toggleFullscreen()
        },
        nevra (pack) {
            return `${pack.epoch}:${pack.name}-${pack.version}-${pack.release}.${pack.arch}`
        },
        createArchColumns (archs) {
            this.columns.push({ name: 'src', label: 'src', field: 'src', align: 'center' })
            archs.forEach(arch => {
                this.archs.push(arch)
                this.columns.push({ name: arch, label: arch, field: arch, align: 'center' })
            })
            this.columns.push({ name: 'button', label: '', field: 'button', align: 'center'})
        },
        moduleLocation (modules) {
            if (modules.length) {
                this.modules = []
                for (const item of modules) {
                    let build_module = item.module
                    build_module.trustRepos = item.repositories
                    build_module.nsvca = this.nsvca(build_module, build_module.arch)
                    build_module.destinationOptions = this.reposOptions(this.orig_repos, build_module.arch)
                    this.beholderRepo(item, 'module')
                    build_module[build_module.arch] = true
                    build_module.force = false
                    this.modules.push(build_module)
                }
            }
        },
        createTable(data){
            this.createArchColumns(data.platform.arch_list)
            this.build_ids = data.build_ids
            this.build_task_ids = data.build_task_ids
            let packages = data.plan.packages
            this.releaseId = data.id
            this.orig_repos = data.plan.repositories
            this.moduleLocation(data.plan.modules)
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
                            return `${repo.name}-${repo.arch}`
                        }
                    }).filter(value => value !== undefined).join()
                }
                if (pkgInRepos !== undefined) {
                    pack.pkgInRepos = [...this.orig_repos.map(repo => {
                        if (pkgInRepos.includes(repo.id)) {
                            return `${repo.name}-${repo.arch}`
                        }
                    }).filter(value => value !== undefined)]
                }
                pack.destinationOptions = this.reposOptions(data.plan.repositories, pack.arch)
                this.beholderRepo(item, 'package')
                this.selectForce(pack)
                this.selectNotNotarized(pack)
                if (item.repo_arch_location) {
                    for (let repo_arch of item.repo_arch_location) {
                        pack[repo_arch] = true
                    }
                }
                this.packagesLocation.push(pack)
            }
            if (this.NotNotarizedPackages().length !== 0) {
                let col = {
                    name: 'force_not_notarized',
                    align: 'left',
                    label: 'Force not notarized',
                    field: 'force_not_notarized'
                }
                this.columns.splice(2, 0, col)
            }
            this.loadingTable = false
        },
        beholderRepo (data, type){
            if (data.repositories.length) {
                if (!data.repositories[0]) return

                for (const index in data[type].destinationOptions){
                    if (data[type].destinationOptions[index].label == data.repositories[0].name) {
                        data[type].destination = data[type].destinationOptions[index]
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
        NotNotarizedPackages () {
            let notNotarized = this.packagesLocation.filter( pack => !pack.cas_hash)
            return notNotarized
        },
        selectNotNotarized (row) {
            if (this.viewOnly) return

            if (row.cas_hash) return

            if (row.force_not_notarized){
                this.selectedNotNotarized.push(row)
            } else {
                let index = this.selectedNotNotarized.indexOf(row)
                this.selectedNotNotarized = [ ...this.selectedNotNotarized.slice(0, index), ...this.selectedNotNotarized.slice(index + 1) ]
            }
            switch (this.selectedNotNotarized.length) {
                case this.NotNotarizedPackages().length:
                    this.forceNotNotarizedAll = true
                    break;
                case 0:
                    this.forceNotNotarizedAll = false
                    break;
                default:
                    this.forceNotNotarizedAll = null
                    break;
            }
        },
        selectNotNotarizedAll () {
            if (this.viewOnly) return

            this.selectedNotNotarized = this.forceNotNotarizedAll ? this.NotNotarizedPackages : []
            this.packagesLocation.forEach (pack => {
                if (!pack.cas_hash)
                    pack.force_not_notarized = this.forceNotNotarizedAll
            })
        },
        selectForceAll () {
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
        deleteModule(item) {
            let index = this.modules.indexOf(item)
            this.modules = [ ...this.modules.slice(0, index), ...this.modules.slice(index + 1) ]
        },
        addModule (item){
            if (item.destination){
                let index = this.modules.indexOf(item)
                let row = JSON.parse(JSON.stringify(item))
                row.destination = ''
                this.modules.splice(index + 1, 0, row)
            }
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
                modules: [],
                repositories: this.orig_repos
            }
            this.modules.forEach(moduleLocation => {
                let repos = []
                let build_module = {
                    arch: moduleLocation.arch,
                    build_id: moduleLocation.build_id,
                    context: moduleLocation.context,
                    name: moduleLocation.name,
                    stream: moduleLocation.stream,
                    template: moduleLocation.template,
                    version: moduleLocation.version
                }
                this.archs.forEach(arch => {
                    if (moduleLocation[arch] && this.repositories[arch] && moduleLocation.destination) {
                        if (this.repositories[arch][moduleLocation.destination.value]) {
                            repos.push(this.repositories[arch][moduleLocation.destination.value])
                        }
                    }
                })
                plan.modules.push({
                    'module': build_module,
                    'repositories': repos
                })
            })
            this.packagesLocation.forEach(packLocation => {
                let repos = []
                let repo_arch_location = []
                let pack = {
                    arch: packLocation.arch,
                    artifact_href: packLocation.artifact_href,
                    href_from_repo: packLocation.href_from_repo,
                    epoch: packLocation.epoch,
                    full_name: packLocation.full_name,
                    name: packLocation.name,
                    force: packLocation.force,
                    force_not_notarized: packLocation.force_not_notarized,
                    release: packLocation.release,
                    sha256: packLocation.sha256,
                    cas_hash: packLocation.cas_hash,
                    version: packLocation.version
                }
                this.archs.forEach(arch => {
                    if (packLocation[arch] && this.repositories[arch] && packLocation.destination) {
                        if (this.repositories[arch][packLocation.destination.value]) {
                            repo_arch_location.push(arch)
                            repos.push(this.repositories[arch][packLocation.destination.value])
                        }
                    }
                })
                plan.packages.push({
                    'package': pack,
                    'repositories': repos,
                    'repo_arch_location': repo_arch_location
                })
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
                            Notify.create({message: response.data.message, type: 'positive',
                                actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                            this.$router.push(`/release-feed`)                            
                                this.$router.push(`/release-feed`)
                            this.$router.push(`/release-feed`)                            
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
