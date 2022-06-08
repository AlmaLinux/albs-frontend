<template>
    <div v-if="advisory">
        <q-card>
            <q-card-section class="row q-gutter-md" style="max-width: 100%">
                <q-field label="Platform" stack-label class="col">
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ platformName(advisory.platform_id) }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Definitive version" class="col" stack-label >
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ advisory.definition_version }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Issued Date" class="col" stack-label>
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ formatDate(advisory.issued_date) }}
                        </div>
                    </template>
                </q-field>
                <q-field label="Updated Date" class="col" stack-label>
                    <template v-slot:control>
                        <div class="self-center full-width no-outline" tabindex="0">
                            {{ formatDate(advisory.updated_date) }}
                        </div>
                    </template>
                </q-field>
            </q-card-section>
            <q-card-section class="q-gutter-md" style="max-width: 100%">
                <q-input v-model="title" label="Bulletin title">
                    <template v-slot:append>
                        <q-btn v-if="titleWarn(advisory.title)" round dense flat color="warning" icon="warning" @click="showTitle = true">
                            <q-tooltip>
                                Bulletin title in Pulp and ALBS DB is different.<br>Click to show the original title
                            </q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
                <q-input type="textarea" input-style="height: 250px"
                            v-model="description" label="Description">
                    <template v-slot:append>
                        <q-btn v-if="descriptionWarn(advisory.description)" round dense flat color="warning" icon="warning" @click="showDescription = true">
                            <q-tooltip>
                                The description in Pulp and ALBS DB is different.<br>Click to show the original description
                            </q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
            </q-card-section>
            <q-card-section align="center">
                <q-tabs
                    v-model="tab"
                    dense
                    class="text-grey"
                    active-color="primary"
                    indicator-color="primary"
                    align="justify"
                    narrow-indicator
                    style="width: 60%"
                    >
                        <q-tab name="patchInfo" no-caps label="Patch Info"/>
                        <q-tab name="packages" no-caps label="Packages"/>
                    </q-tabs>

                    <q-separator />

                    <q-tab-panels v-model="tab" animated>
                        <q-tab-panel name="patchInfo">
                            <q-expansion-item label="CVE information" expand-separator
                                                icon="privacy_tip" default-opened align="left"
                                                v-if="cveRows(advisory.references).length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="cveRows(advisory.references)"
                                                :columns="cveCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                                <template v-slot:body="props">
                                                    <q-tr :props="props">
                                                        <q-td key="cvePublic" :props="props">{{ formatDate(props.row.cve.public) }}</q-td>
                                                        <q-td key="severity" :props="props">{{ toCapitalize(props.row.cve.impact) }}</q-td>
                                                        <q-td key="url" :props="props">
                                                            <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                        </q-td>
                                                        <q-td key="refcvss" :props="props">{{ props.row.cve.cvss3}}</q-td>
                                                    </q-tr>
                                                </template>
                                            </q-table>
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                            <q-expansion-item label="References" expand-separator
                                                icon="shopping_cart" align="left"
                                                v-if="advisory.references.length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="advisory.references"
                                                :columns="refCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                                <template v-slot:body="props">
                                                    <q-tr :props="props">
                                                        <q-td key="source" :props="props">
                                                            <span v-if="props.row.ref_type.split('.')[1] === 'bugzilla'">
                                                                {{ toCapitalize(props.row.ref_type.split('.')[1]) }}
                                                            </span>
                                                            <span v-else>
                                                                {{ props.row.ref_type.split('.')[1].toUpperCase() }}
                                                            </span>
                                                        </q-td>
                                                        <q-td key="url" :props="props">
                                                            <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                        </q-td>
                                                        <q-td key="id" :props="props">{{ props.row.ref_id }}</q-td>
                                                    </q-tr>
                                                </template>
                                            </q-table>
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                            <q-expansion-item label="Bugzilla info" expand-separator
                                                icon="info" align="left"
                                                v-if="bugzillaRows(advisory.references).length">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="bugzillaRows(advisory.references)"
                                                :columns="bugzillaCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                                <template v-slot:body="props">
                                                    <q-tr :props="props">
                                                        <q-td key="id" :props="props">{{ props.row.ref_id }}</q-td>
                                                        <q-td key="url" :props="props">
                                                            <a :href="props.row.href" target="_blank">{{ props.row.href }}</a>
                                                        </q-td>
                                                        <q-td key="title" :props="props">{{ props.row.title}}</q-td>
                                                    </q-tr>
                                                </template>
                                            </q-table>
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                        </q-tab-panel>

                        <q-tab-panel name="packages">
                            <q-table
                                flat bordered dense
                                :rows="projects"
                                :columns="patchInfoCol"
                                hide-pagination
                                :rows-per-page-options=[0]
                            >
                            <template v-slot:top-right="props">
                                <div class="q-gutter-md">
                                    <q-btn
                                        flat round dense
                                        :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                                        @click="props.toggleFullscreen"
                                    />
                                    <template v-if="notReleasedRPMs().length !== 0">
                                        <q-btn
                                            size="80%"
                                            no-caps icon="redo"
                                            color="red-8"
                                            @click="changeStatus('skipped')"
                                        >
                                            Skip
                                        </q-btn>
                                        <q-btn
                                            size="80%"
                                            no-caps
                                            icon="lightbulb_outline"
                                            color="orange-14"
                                            @click="changeStatus('proposal')"
                                        >
                                            Propose
                                        </q-btn>
                                        <q-btn
                                            size="80%"
                                            no-caps
                                            icon="done"
                                            color="primary"
                                            @click="changeStatus('approved')"
                                        >
                                            Approve
                                        </q-btn>
                                    </template>
                                </div>
                            </template>
                            <template v-slot:header="props">
                                <q-tr :props="props">
                                    <q-th v-for="col in props.cols"
                                        :key="col.name" :props="props">
                                    <q-checkbox v-if="col.name === 'nevra'"
                                                v-model="selectedAll"
                                                @click="selectAllRPMs"
                                                :disable="notReleasedRPMs().length === 0"/>
                                        {{ col.label }}
                                    </q-th>
                                </q-tr>
                            </template>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="nevra" :props="props" style="border-bottom: 0;">
                                        <q-checkbox
                                            v-model="props.row.selected"
                                            @click="selectRPM(props.row)"
                                        />
                                        {{ props.row.nevra }}
                                    </q-td>
                                    <q-td key="build" :props="props" style="border-bottom: 0;" class="text-center">
                                        <q-select v-model="props.row.selected_build"
                                        :options="props.row.albs_builds">
                                            <template v-if="props.row.selected_build && props.row.selected_build.build_id" v-slot:before>
                                                <q-btn
                                                    round dense flat
                                                    icon="link"
                                                    @click.stop 
                                                    :to="{path: `/build/${props.row.selected_build.build_id}`}"
                                                    target="_blank"
                                                >
                                                    <q-tooltip>
                                                        Click to go to the Build {{ props.row.selected_build.build_id }}
                                                    </q-tooltip>
                                                </q-btn>
                                            </template>
                                        </q-select>
                                    </q-td>
                                    <q-td key="status" :props="props" style="border-bottom: 0;" class="text-center">
                                        <q-chip
                                            :color="statusColor(statusBuild(props.row.selected_build))"
                                            text-color="white"
                                            dense
                                            class="text-weight-bolder"
                                            square
                                            >{{ statusBuild(props.row.selected_build) }}
                                        </q-chip>
                                    </q-td>
                                </q-tr>
                                <q-tr no-hover>
                                    <q-td colspan="100%">
                                        <q-tree
                                                :nodes="props.row.packages"
                                                node-key="label"
                                        >
                                            <template v-slot:header-root="prop">
                                                <div class="row items-center">
                                                    <q-icon :name="prop.node.icon"/>
                                                    <div>
                                                        {{ prop.node.label }}
                                                        <q-badge v-if="props.row.warning" color="orange" class="q-ml-sm">Warning</q-badge>
                                                    </div>
                                                </div>
                                            </template>
                                            <template v-slot:header-generic="prop">
                                                <div class="row items-center">
                                                    {{ prop.node.label }}
                                                    <div class="q-pl-xs">
                                                        <q-badge v-if="prop.node.warn" color="red">
                                                            <q-tooltip>
                                                                This package was not found in Build {{ props.row.selected_build.build_id }}
                                                            </q-tooltip>
                                                        </q-badge>
                                                    </div>
                                                </div>
                                            </template>
                                        </q-tree>
                                    </q-td>
                                </q-tr>
                            </template>
                            </q-table>
                        </q-tab-panel>
                    </q-tab-panels>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn no-caps color="green" @click="updateAdvisory(advisory.id)" :loading="loading">Save</q-btn>
                <q-btn no-caps color="primary" @click="toRelease()">Release packages</q-btn>
            </q-card-actions>
        </q-card>
    </div>
    <q-dialog v-model="showTitle">
            <q-card style="width: 550px;">
                <q-card-section>
                    <div class="text-h6">Original Title</div>
                </q-card-section>
                    <q-card-section>
                        <q-field stack-label>
                            <template v-slot:control>
                                <div class="self-center full-width no-outline" tabindex="0"> {{ advisory.original_title }} </div>
                            </template>
                        </q-field>
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        flat
                        text-color="primary"
                        label="Replace"
                        no-caps
                        @click="this.title = this.advisory.original_title">
                        <q-tooltip>
                            Replace with the original title
                        </q-tooltip>
                    </q-btn>
                    <q-btn
                        v-if="advisory.title && advisory.title !== title"
                        flat
                        text-color="primary"
                        label="Restore"
                        no-caps
                        @click="this.title = this.advisory.title">
                        <q-tooltip>
                            Restore title from Data Base
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="negative" label="Cancel"
                            v-close-popup no-caps/>
                    </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="showDescription" style="max-width: 100%">
            <q-card style="width: 50%; max-width: 100%">
                <q-card-section>
                    <div class="text-h6">Original Description</div>
                </q-card-section>
                    <q-card-section>
                        <q-input
                            v-model="advisory.original_description"
                            autogrow
                            readonly
                        />
                    </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        v-if="advisory.description && advisory.description !== description"
                        flat
                        text-color="primary"
                        label="Restore"
                        no-caps
                        @click="this.description = this.advisory.description">
                        <q-tooltip>
                            Restore description from Data Base
                        </q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        text-color="primary"
                        label="Replace"
                        no-caps
                        @click="this.description = this.advisory.original_description">
                        <q-tooltip>
                            Replace with the original description
                        </q-tooltip>
                    </q-btn>
                    <q-btn flat text-color="negative" label="Cancel"
                            v-close-popup no-caps/>
                    </q-card-actions>
            </q-card>
        </q-dialog>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'

export default defineComponent({
    name: 'errata-info',
    props: {
        platforms: Array
    },
    emits: ["updateFeed", "updatePackages"],
    data () {
        return {
            advisory: null,
            projects: null,
            tab: ref('patchInfo'),
            loading: false,
            description: '',
            showDescription: false,
            title: '',
            showTitle: false,
            refCol: [
                { name: 'source', required: true, align: 'left', label: 'Reference source', field: 'source'},
                { name: 'url', required: true, align: 'left', label: 'Reference URL', field: 'url', style: 'word-break: break-word;' },
                { name: 'id', required: true, align: 'left', label: 'Reference Id', field: 'id'}],
            cveCol: [
                { name: 'cvePublic', required: true, align: 'left', label: 'CVE public', field: 'cvePublic'},
                { name: 'severity', required: true, align: 'left', label: 'Severity', field: 'severity' },
                { name: 'url', required: true, align: 'left', label: 'URL', field: 'url', style: 'word-break: break-word;',},
                { name: 'refcvss', required: true, align: 'left', label: 'Ref CVSS3', field: 'refcvss', style: 'width: 230px; word-break: break-word;', }],
            bugzillaCol: [
                { name: 'id', required: true, align: 'left', label: 'Bugzilla ID', field: 'id'},
                { name: 'url', required: true, align: 'left', label: 'Ticket URL', field: 'url', style: 'word-break: break-word;' },
                { name: 'title', required: true, align: 'left', label: 'Title', field: 'title'}],
            patchInfoCol: [
                { name: 'nevra', required: true, align: 'left', label: 'RHEL', field: 'nevra'},
                { name: 'build', required: true, align: 'centar', label: 'Alma', field: 'build' },
                { name: 'status', required: true, align: 'centar', label: 'Status', field: 'status'}
            ],
            selected: [],
            selectedAll: false
        }      
    },
    methods: {
        open (advisory) {
            this.advisory = advisory
            this.description = this.advisory.description ? this.advisory.description : this.advisory.original_description
            this.title = this.advisory.title ? this.advisory.title : this.advisory.original_title
            this.selectedAll = false
            this.matchingPackage(advisory)
        },
        updateAdvisory (id) {
            this.loading = true
            let data = {
                errata_record_id: id,
                title: this.title,
                description: this.description
            }
            this.$api.post('/errata/update/', data)
            .then(response => {
                this.loading = false
                this.advisory = response.data
                this.description = this.advisory.description ? this.advisory.description : this.advisory.original_description
                this.title = this.advisory.title ? this.advisory.title : this.advisory.original_title
                this.$emit('updateFeed')
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
        matchingPackage (advisory) {
            let packages = {}
            let arch_list = this.platforms.find(platform => platform.value == advisory.platform_id).arch_list
            advisory.packages.forEach(pack => {
                if (arch_list.includes(pack.arch)) {
                    packages[pack.source_srpm] ? packages[pack.source_srpm].push(pack) : packages[pack.source_srpm] = [pack]
                }
            })
            let projects = []
            let notFoundProjects = {}
            Object.keys(packages).forEach(src => {
                let build_options = {}
                let project = {
                    source_srpm: packages[src][0].source_srpm,
                    nevra: this.nevr(packages[src][0]),
                    warning: false,
                    released: false,
                    packages: [
                        {
                            label: 'Packages',
                            icon: 'source',
                            header: 'root',
                            children: []
                        }
                    ]
                }
                let approved = false
                packages[src].forEach(pack => {
                    pack.albs_packages.forEach(albs => {
                        build_options[albs.status] = {
                            status: albs.status
                        }
                        if (albs.status === 'released'){
                            build_options[albs.status].label = src
                            build_options[albs.status].value = src
                            project.released = true
                        } else {
                            build_options[albs.status].build_id = albs.build_id
                            build_options[albs.status].label = `Build ${albs.build_id}: ${src}`
                            build_options[albs.status].value =  albs.build_id
                        }
                        if (albs.status === 'approved') approved = true
                    })
                    if (pack.albs_packages.length === 0){
                        pack.warn = true
                        project.warning = true
                    }
                    pack.label = this.nevra(pack)
                    pack.header = 'generic'
                    project.packages[0].children.push(pack)
                })
                project.albs_builds = Object.values(build_options)
                 if (project.released){
                    project.selected_build = project.albs_builds.find(build => build.status === 'released')
                }
                else if (approved) {
                    project.selected_build = project.albs_builds.find(build => build.status === 'approved')
                }
                else {
                    project.selected_build = project.albs_builds[0]
                }
                project.selected = false
                if (src === 'null') {
                    notFoundProjects = project
                } else {
                    projects.push(project)
                }
            })
            if (notFoundProjects && Object.keys(notFoundProjects).length !== 0)
                projects.push(notFoundProjects)
            this.projects = projects
        },
        titleWarn (title) {
            return title && title !== this.advisory.original_title
        },
        descriptionWarn (description) {
            return description && description !== this.advisory.original_description
        },
        platformName (id) {
            return this.platforms.find(platform => platform.value == id).label
        },
        cveRows (refs) {
            return refs.filter(ref => ref.cve)
        },
        bugzillaRows (refs) {
            return refs.filter(ref => ref.ref_type.split('.')[1] === 'bugzilla')
        },
        formatDate (date) {
            const longEnUSFormatter = new Intl.DateTimeFormat('en-US', {
                year:  'numeric',
                month: 'long',
                day:   'numeric',
            })
            return longEnUSFormatter.format(new Date(date))
        },
        toCapitalize (str) {
            return str.charAt(0).toUpperCase() + str.slice(1)
        },
        nevr (pack) {
            if (pack.source_srpm) {
                return `${pack.epoch}:${pack.source_srpm}-${pack.version}-${pack.release}`
            } else {
                return 'Not found'
            }
        },
        nevra (pack) {
            return `${pack.epoch}:${pack.name}-${pack.version}-${pack.release}.${pack.arch}`
        },
        statusPackage (pack){
            return pack ? this.toCapitalize(pack.status) : 'Skipped'
        },
        statusBuild (build){
            return build ? this.toCapitalize(build.status) : 'Skipped'
        },
        statusColor(status){
            let col = ''
            switch (status) {
                case 'Proposal':
                    col = 'orange'
                    break;
                case 'Skipped':
                    col = 'red'
                    break;
                case 'Released':
                    col = 'green'
                    break;
                case 'Approved':
                    col = 'primary'
                    break;
                default:
                    break;
            }
            return col
        },
        notReleasedRPMs () {
            let notReleasedRPMs = []
            this.projects.forEach(src => {
                if (src.source_srpm && !src.released)
                    notReleasedRPMs.push(src)
            })
            return notReleasedRPMs
        },
        selectRPM (src) {
            if (this.notReleasedRPMs().length === 0) return

            if (src.selected) {
                this.selected.push(src)
            } else {
                let index = this.selected.indexOf(src)
                this.selected = [ ...this.selected.slice(0, index), ...this.selected.slice(index + 1) ]
            }
            switch (this.selected.length) {
                case this.notReleasedRPMs().length:
                    this.selectedAll = true
                    break;
                case 0:
                    this.selectedAll = false
                    break;
                default:
                    this.selectedAll = null
                    break;
            }
        },
        selectAllRPMs () {
            this.selected = this.selectedAll ?  this.notReleasedRPMs() : []
            this.notReleasedRPMs().forEach (rpm => {
                rpm.selected = this.selectedAll
            })
        },
        changeStatus (status) {
            if (this.selected.length === 0) {
                Notify.create({
                    message: 'Please select at least one rpm',
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
                return
            }

            let request_body = []
            this.selected.forEach(src => {
                    if (src.selected_build && src.selected_build.status !== 'released') {
                        let data = {
                            errata_record_id: this.advisory.id,
                            status: status,
                            build_id: src.selected_build.build_id,
                            source: src.source_srpm
                        }
                        if (data.build_id) request_body.push(data)
                    }
            })
            if (request_body.length) {
                this.$api.post('/errata/update_package_status/', request_body)
                .then(response => {
                    this.$emit('updatePackages', this.advisory.id)
                    if (!response.data.ok) {
                        Notify.create({
                            message: response.date.error,
                            type: 'negative',
                            actions: [
                                { label: 'Dismiss', color: 'white', handler: () => {} }
                            ]
                        })
                    }
                })
                .catch(error => {
                    console.log(error)
                    if (error.response) {
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


        },
        toRelease () {
            let builds = new Set()
            let build_tasks = []
            for (const src in this.packages) {
                this.packages[src].forEach(pack => {
                    if (src !== 'null' && pack.selectedALBS && pack.selectedALBS.status === 'approved') {
                        builds.add(pack.selectedALBS.build_id)
                        build_tasks.push(pack.selectedALBS.task_id)
                    }
                })
            }
            if (build_tasks.length) {
                let request_body = {
                    builds: Array.from(builds),
                    build_tasks: build_tasks,
                    platform_id: this.advisory.platform_id,
                    reference_platform_id: this.advisory.platform_id,
                }
                request_body = JSON.stringify(request_body)
                this.$router.push({
                    name: 'ErrataRelease',
                    params: { request_body }
                })
            } else {
                Notify.create({
                    message: 'Please approve at least one package',
                    type: 'negative',
                    actions: [
                        { label: 'Dismiss', color: 'white', handler: () => {} }
                    ]
                })
            }
        }    
    }
})
</script>

<style scoped>
</style>